const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, 
    ChannelType, PermissionFlagsBits, ModalBuilder, 
    TextInputBuilder, TextInputStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- الإعدادات ---
const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1; // عداد الطلبات

// دالة الضريبة
function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) {
        return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    }
    return parseInt(str);
}

client.once('ready', () => console.log(`✅ ${client.user.tag} متصل وجاهز!`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- أمر تأكيد الطلب !y [ID] ---
    if (message.content.startsWith('!y')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.split(/ +/);
        const targetID = args[1];
        if (!targetID) return message.reply("⚠️ يرجى وضع ID الشخص: `!y [ID]`");

        const targetUser = await client.users.fetch(targetID).catch(() => null);
        if (!targetUser) return message.reply("❌ لم يتم العثور على هذا العضو.");

        const confirmEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle("تأكيد عملية الشراء")
            .setDescription(`${targetUser}، عند شراء الغرض يرجى قراءة القوانين ونحن غير مسؤولين عن أي سوء استخدام بعد البيع. هل أنت متأكد؟`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_${targetID}`).setLabel('تأكيد الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancel_${targetID}`).setLabel('إلغاء الشراء').setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ content: `${targetUser}`, embeds: [confirmEmbed], components: [row] });
    }

    // --- باقي الأوامر (!tax, !تكت, !رسالة) ---
    if (message.content.startsWith('!tax')) {
        const args = message.content.split(/ +/);
        if (!args[1]) return message.reply("⚠️ !tax 1m");
        const price = parseAmount(args[1]);
        if (isNaN(price)) return message.reply("❌ رقم غير صحيح.");
        await message.channel.send(`${Math.floor(price / 0.95) + 1}`);
    }

    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const embed = new EmbedBuilder().setTitle('قائمة التذاكر').setColor(0x808080).setImage(MAIN_IMAGE);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    { label: 'شراء غرض', value: 'buy_option' },
                    { label: 'الدعم الفني', value: 'support_option' }
                ])
        );
        await message.channel.send({ embeds: [embed], components: [menu] });
    }

    if (message.content.startsWith('!رسالة')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.slice('!رسالة'.length).trim().split(/ +/);
        const targetID = args.shift();
        const text = args.join(' ');
        const targetRole = message.guild.roles.cache.get(targetID);
        if (targetRole) {
            const members = await message.guild.members.fetch();
            const roleMembers = members.filter(m => m.roles.cache.has(targetID));
            for (const [id, member] of roleMembers) {
                try { await member.send(`${member} \n\n${text}`); } catch (e) {}
            }
            return message.reply(`✅ تم الإرسال لـ ${roleMembers.size} عضو.`);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    // التعامل مع أزرار التأكيد (أمر !y)
    if (interaction.isButton()) {
        const [action, targetId] = interaction.customId.split('_');

        if (action === 'confirm' || action === 'cancel') {
            if (interaction.user.id !== targetId) {
                return interaction.reply({ content: "❌ هذا الزر ليس لك!", ephemeral: true });
            }

            if (action === 'confirm') {
                const currentOrder = orderCounter++;
                // رسالة في القناة
                await interaction.update({ content: `✅ تم تأكيد الطلب بنجاح بواسطة ${interaction.user}`, embeds: [], components: [] });
                
                // رسالة الخاص للعميل
                try {
                    await interaction.user.send(`✅ **تم تأكيد طلبك بنجاح!**\n📦 **رقم الطلب:** #${currentOrder}\n👤 **العميل:** ${interaction.user.username}`);
                } catch (e) { console.log("تعذر إرسال رسالة الخاص للعميل."); }

                // رسالة اللوج
                const logChan = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChan) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle("تأكيد طلب جديد")
                        .addFields(
                            { name: "رقم الطلب:", value: `#${currentOrder}`, inline: true },
                            { name: "العميل:", value: `${interaction.user.tag}`, inline: true },
                            { name: "ID العميل:", value: `${interaction.user.id}`, inline: true }
                        )
                        .setTimestamp();
                    await logChan.send({ embeds: [logEmbed] });
                }
            } else if (action === 'cancel') {
                await interaction.update({ content: `❌ تم رفض شراء الطلب بواسطة ${interaction.user}`, embeds: [], components: [] });
            }
        }
    }

    // --- التعامل مع التكتات (Menu & Modals) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        const modal = new ModalBuilder().setCustomId(`modal_${choice}`).setTitle('تعبئة البيانات');
        if (choice === 'buy_option') {
            const i1 = new TextInputBuilder().setCustomId('item_field').setLabel('نوع الغرض').setStyle(TextInputStyle.Short).setRequired(true);
            const i2 = new TextInputBuilder().setCustomId('pay_field').setLabel('طريقة التحويل').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(i1), new ActionRowBuilder().addComponents(i2));
        } else if (choice === 'support_option') {
            const i1 = new TextInputBuilder().setCustomId('issue_field').setLabel('اشرح مشكلتك').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(i1));
        }
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'rename_modal') {
            const n = interaction.fields.getTextInputValue('new_name_field');
            await interaction.channel.setName(n);
            return interaction.reply(`✅ تم التغيير لـ: ${n}`);
        }

        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.replace('modal_', '');
        const ch = await interaction.guild.channels.create({
            name: `${type === 'buy_option' ? 'order' : 'support'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const eb = new EmbedBuilder().setColor(0x808080).setTitle(type === 'buy_option' ? '🛒 طلب شراء' : '🛠️ دعم فني');
        if (type === 'buy_option') {
            eb.addFields(
                { name: 'الغرض:', value: interaction.fields.getTextInputValue('item_field'), inline: true },
                { name: 'التحويل:', value: interaction.fields.getTextInputValue('pay_field'), inline: true }
            );
        } else {
            eb.addFields({ name: 'المشكلة:', value: interaction.fields.getTextInputValue('issue_field') });
        }

        const b = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير اسم').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_btn').setLabel('حذف').setStyle(ButtonStyle.Danger)
        );

        await ch.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [eb], components: [b] });
        await interaction.editReply(`✅ تذكرتك: ${ch}`);
    }

    // أزرار التكت
    if (interaction.isButton() && ['claim_btn', 'rename_btn', 'delete_btn'].includes(interaction.customId)) {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: 'للإدارة!', ephemeral: true });
        if (interaction.customId === 'claim_btn') await interaction.channel.send(`🔒 استلم: <@${interaction.user.id}>`);
        if (interaction.customId === 'rename_btn') {
            const m = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير الاسم');
            const i = new TextInputBuilder().setCustomId('new_name_field').setLabel('الاسم').setStyle(TextInputStyle.Short).setRequired(true);
            m.addComponents(new ActionRowBuilder().addComponents(i));
            await interaction.showModal(m);
        }
        if (interaction.customId === 'delete_btn') {
            const log = client.channels.cache.get(LOG_CHANNEL_ID);
            if (log) log.send(`🗑️ حذف: ${interaction.channel.name}`);
            setTimeout(() => interaction.channel.delete(), 2000);
        }
    }
});

// استدعاء التوكن من السكرت (Secrets)
client.login(process.env.TOKEN); 


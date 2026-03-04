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
const BUY_CATEGORY_ID = '1478604299549544601'; // كتاقوري الشراء
const SUPPORT_CATEGORY_ID = '1477992348033093683'; // كتاقوري الدعم
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1;

function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    return parseInt(str);
}

client.once('ready', () => console.log(`✅ ${client.user.tag} متصل وجاهز!`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const mainEmbed = new EmbedBuilder()
            .setTitle('قائمة التذاكر')
            .setDescription('اختر من الخيارات الموجوده \n بخط صغير حسب المشكله او الطلب')
            .setColor(0x808080)
            .setImage(MAIN_IMAGE);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    { label: 'شراء غرض', description: 'للشراء افتح تذكره من هنا', value: 'buy_option' },
                    { label: 'الدعم الفني', description: 'لديك مشكله او استفسار هنا', value: 'support_option' },
                    { label: 'تحديث القائمة', description: 'لتحديث قائمة الخيارات من هنا', value: 'refresh' }
                ])
        );
        await message.channel.send({ embeds: [mainEmbed], components: [menu] });
    }

    if (message.content.startsWith('!y')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.split(/ +/);
        const targetID = args[1];
        if (!targetID) return message.reply("⚠️ يرجى وضع ID الشخص");

        const targetUser = await client.users.fetch(targetID).catch(() => null);
        if (!targetUser) return message.reply("❌ عضو غير موجود");

        const confirmEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('قائمة فيه')
            .setDescription(`عند شراء الغرض يرجى قراءة القوانين ونحن غير مسؤلين \n\n العميل الموجه له الطلب: ${targetUser}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirm_${targetID}`).setLabel('تاكيد الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancel_${targetID}`).setLabel('إلغاء الشراء').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [confirmEmbed], components: [row] });
    }

    if (message.content.startsWith('!tax')) {
        const args = message.content.split(/ +/);
        if (args[1]) {
            const price = parseAmount(args[1]);
            if (!isNaN(price)) await message.channel.send(`${Math.floor(price / 0.95) + 1}`);
        }
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
            message.reply(`✅ أرسلت لـ ${roleMembers.size} عضو.`);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم تحديث القائمة.', ephemeral: true });

        const modal = new ModalBuilder().setCustomId(`modal_${choice}`).setTitle(choice === 'buy_option' ? 'طلب شراء' : 'الدعم الفني');
        if (choice === 'buy_option') {
            const item = new TextInputBuilder().setCustomId('item_field').setLabel('نوع الغرض').setStyle(TextInputStyle.Short).setRequired(true);
            const pay = new TextInputBuilder().setCustomId('pay_field').setLabel('طريقة التحويل').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(item), new ActionRowBuilder().addComponents(pay));
        } else {
            const issue = new TextInputBuilder().setCustomId('issue_field').setLabel('اشرح مشكلتك').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(issue));
        }
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'rename_modal') {
            const n = interaction.fields.getTextInputValue('new_name_field');
            await interaction.channel.setName(n);
            return interaction.reply(`✅ تم تغيير اسم التذكره لـ: ${n}`);
        }

        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.replace('modal_', '');
        const isBuy = type === 'buy_option';
        
        // تحديد الكتاقوري بناءً على نوع التذكرة
        const targetParent = isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID;

        const channel = await interaction.guild.channels.create({
            name: `${isBuy ? 'order' : 'support'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: targetParent, 
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const eb = new EmbedBuilder().setColor(0x808080);
        if (isBuy) {
            eb.setDescription(`**الطلب:** ${interaction.fields.getTextInputValue('item_field')}\n**طريقة الدفع:** ${interaction.fields.getTextInputValue('pay_field')}`);
        } else {
            eb.setDescription(`**المشكلة:** ${interaction.fields.getTextInputValue('issue_field')}`);
        }

        const b = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام التذكره').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير اسم التذكره').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_btn').setLabel('حذف التذكرة').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [eb], components: [b] });
        await interaction.editReply(`✅ تم فتح تذكرتك: ${channel}`);
    }

    if (interaction.isButton()) {
        const [btnAction, targetId] = interaction.customId.split('_');

        if (btnAction === 'confirm' || btnAction === 'cancel') {
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر ليس لك!", ephemeral: true });
            if (btnAction === 'confirm') {
                const num = orderCounter++;
                await interaction.update({ content: `✅ تم تاكيد الطلب بنجاح بواسطة ${interaction.user}`, embeds: [], components: [] });
                try { await interaction.user.send(`${interaction.user} \n\n تم تاكيد طلب رقم الطلب | ${num} \n اسم العميل | ${interaction.user.username}`); } catch(e){}
                const log = client.channels.cache.get(LOG_CHANNEL_ID);
                if (log) log.send(`✅ تم التأكيد | رقم الطلب: ${num} | العميل: ${interaction.user.tag}`);
            } else {
                await interaction.update({ content: `❌ تم رفض شراء الطلب`, embeds: [], components: [] });
            }
            return;
        }

        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: 'للإدارة فقط!', ephemeral: true });

        if (interaction.customId === 'claim_btn') await interaction.channel.send(`🔒 تم استلام التذكره بواسطة: <@${interaction.user.id}>`);
        if (interaction.customId === 'rename_btn') {
            const m = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير الاسم');
            const i = new TextInputBuilder().setCustomId('new_name_field').setLabel('اكتب الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
            m.addComponents(new ActionRowBuilder().addComponents(i));
            await interaction.showModal(m);
        }
        if (interaction.customId === 'delete_btn') {
            const log = client.channels.cache.get(LOG_CHANNEL_ID);
            if (log) log.send(`🗑️ تذكرة محذوفة: ${interaction.channel.name}`);
            setTimeout(() => interaction.channel.delete(), 2000);
        }
    }
});


// استدعاء التوكن من السكرت (Secrets)
client.login(process.env.TOKEN); 

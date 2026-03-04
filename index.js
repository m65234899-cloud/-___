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
const BUY_CATEGORY_ID = '1478604299549544601'; 
const SUPPORT_CATEGORY_ID = '1477992348033093683'; 
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1;
const invoices = new Map(); // لتخزين بيانات الفواتير

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

    // أمر !تكت
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

    // أمر !y
    if (message.content.startsWith('!y')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.split(/ +/);
        const targetID = args[1];
        await message.delete().catch(() => null);
        if (!targetID) return;
        const targetUser = await client.users.fetch(targetID).catch(() => null);
        if (!targetUser) return;

        const confirmEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('قائمة الشراء')
            .setDescription(`عند شراء الغرض يرجى قراءة القوانين ونحن غير مسؤلين \n\n العميل الموجه له الطلب: ${targetUser}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`open_modal_${targetID}`).setLabel('تاكيد الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancel_${targetID}`).setLabel('إلغاء الشراء').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [confirmEmbed], components: [row] });
    }

    // أمر !فاتورة
    if (message.content.startsWith('!فاتورة')) {
        const args = message.content.split(/ +/);
        const invNum = args[1];
        if (!invNum) return message.reply("⚠️ اكتب رقم الفاتورة: `!فاتورة 1`").then(m => setTimeout(() => m.delete(), 5000));

        const data = invoices.get(invNum);
        if (!data) return message.reply("❌ رقم الفاتورة غير موجود!").then(m => setTimeout(() => m.delete(), 5000));

        const invEmbed = new EmbedBuilder()
            .setTitle(`فاتورة شراء #${invNum}`)
            .setColor(0x2ecc71)
            .addFields(
                { name: '👤 العميل:', value: `<@${data.userId}>`, inline: true },
                { name: '📦 نوع الغرض:', value: `${data.itemName}`, inline: true },
                { name: '📅 التاريخ:', value: `${data.date}`, inline: false }
            ).setTimestamp();
        await message.channel.send({ embeds: [invEmbed] });
    }

    // أمر !tax و !رسالة
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
        const targetID = args.shift(); const text = args.join(' ');
        await message.delete().catch(() => null);
        if (!targetID || !text) return;
        const targetChannel = message.guild.channels.cache.get(targetID);
        if (targetChannel) { await targetChannel.send(`${text}`); return; }
        const targetRole = message.guild.roles.cache.get(targetID);
        if (targetRole) {
            const members = await message.guild.members.fetch();
            const roleMembers = members.filter(m => m.roles.cache.has(targetID) && !m.user.bot);
            for (const [id, member] of roleMembers) { try { await member.send(`${text}`); } catch (e) {} }
            return;
        }
        try {
            const targetUser = await client.users.fetch(targetID);
            if (targetUser) await targetUser.send(`${text}`);
        } catch (e) {}
    }
});

client.on('interactionCreate', async (interaction) => {
    // 1. التعامل مع الأزرار
    if (interaction.isButton()) {
        const customId = interaction.customId;

        // إذا ضغط "تأكيد الشراء" نفتح له نافذة يكتب فيها
        if (customId.startsWith('open_modal_')) {
            const targetId = customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر ليس لك!", ephemeral: true });

            const modal = new ModalBuilder().setCustomId(`submit_order_${targetId}`).setTitle('إكمال عملية الشراء');
            const itemInput = new TextInputBuilder()
                .setCustomId('order_item_name')
                .setLabel('ما هو نوع الغرض؟')
                .setPlaceholder('مثلاً: رتبة، عملات، غرض معين...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(itemInput));
            return await interaction.showModal(modal);
        }

        if (customId.startsWith('cancel_')) {
            const targetId = customId.split('_')[1];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر ليس لك!", ephemeral: true });
            return await interaction.update({ content: `❌ تم إلغاء الشراء بواسطة ${interaction.user}`, embeds: [], components: [] });
        }

        // أزرار التكت
        if (interaction.customId === 'claim_btn') await interaction.channel.send(`🔒 تم استلام التذكره بواسطة: <@${interaction.user.id}>`);
        if (interaction.customId === 'rename_btn') {
            const m = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير الاسم');
            const i = new TextInputBuilder().setCustomId('new_name_field').setLabel('اكتب الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
            m.addComponents(new ActionRowBuilder().addComponents(i));
            await interaction.showModal(m);
        }
        if (interaction.customId === 'delete_btn') setTimeout(() => interaction.channel.delete(), 2000);
    }

    // 2. استلام بيانات المودال (بعد ما يكتب نوع الغرض)
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('submit_order_')) {
            const targetId = interaction.customId.split('_')[2];
            const itemName = interaction.fields.getTextInputValue('order_item_name');
            const num = orderCounter++;

            // تخزين البيانات
            invoices.set(num.toString(), {
                userId: targetId,
                itemName: itemName,
                date: new Date().toLocaleString('ar-EG')
            });

            await interaction.update({ content: `✅ تم تأكيد الشراء بنجاح للغرض: **${itemName}**`, embeds: [], components: [] });

            // إرسال الفاتورة بالخاص
            try {
                await interaction.user.send(`${interaction.user}\n\n✅ **فاتورة شراء جديدة!**\n📦 **رقم الفاتورة:** \`#${num}\`\n🛒 **نوع الغرض:** ${itemName}\n👤 **العميل:** ${interaction.user.username}`);
            } catch (e) {}

            // إرسال اللوج
            const logChan = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChan) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x2ecc71)
                    .setTitle('تم إصدار فاتورة جديدة')
                    .addFields(
                        { name: 'رقم الفاتورة:', value: `#${num}`, inline: true },
                        { name: 'الغرض:', value: `${itemName}`, inline: true },
                        { name: 'العميل:', value: `${interaction.user.username}`, inline: false }
                    ).setTimestamp();
                await logChan.send({ embeds: [logEmbed] });
            }
        }

        if (interaction.customId === 'rename_modal') {
            const n = interaction.fields.getTextInputValue('new_name_field');
            await interaction.channel.setName(n);
            return interaction.reply(`✅ تم تغيير الاسم لـ: ${n}`);
        }
    }

    // 3. القائمة المنسدلة للتكت
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

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.replace('modal_', '');
        const isBuy = type === 'buy_option';
        const channel = await interaction.guild.channels.create({
            name: `${isBuy ? 'order' : 'support'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID,
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
});

client.login(process.env.TOKEN);

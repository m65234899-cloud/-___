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
        GatewayIntentBits.MessageContent
    ]
});

// --- الإعدادات (تأكد من الـ IDs) ---
const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676'; // رتبة الإدارة
const LOG_CHANNEL_ID = '1473378884857630821'; // روم السجلات
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} يعمل بنجاح!`);
});

// --- الأوامر الكتابية (!تكت و !رسالة) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // 1. أمر إنشاء قائمة التذاكر
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const mainEmbed = new EmbedBuilder()
            .setTitle('قائمة التذاكر')
            .setDescription('اختر من الخيارات الموجودة أدناه حسب المشكلة أو الطلب')
            .setColor(0x808080)
            .setImage(MAIN_IMAGE);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    { label: 'شراء غرض', description: 'للشراء افتح تذكرة من هنا', value: 'buy' },
                    { label: 'الدعم الفني', description: 'لديك مشكلة أو استفسار هنا', value: 'support' },
                    { label: 'تحديث القائمة', description: 'لتحديث قائمة الخيارات من هنا', value: 'refresh' }
                ])
        );

        await message.channel.send({ embeds: [mainEmbed], components: [menu] });
    }

    // 2. أمر !رسالة [ID] [نص]
    if (message.content.startsWith('!رسالة')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const args = message.content.slice('!رسالة'.length).trim().split(/ +/);
        const targetID = args.shift();
        const text = args.join(' ');

        if (!targetID || !text) return message.reply('⚠️ الاستخدام: `!رسالة [ID الروم/الرتبة] [النص]`');

        // البحث عن روم
        const targetChannel = client.channels.cache.get(targetID);
        if (targetChannel) {
            await targetChannel.send(text);
            return message.reply(`✅ أرسلت الرسالة إلى روم: ${targetChannel.name}`);
        }

        // البحث عن رتبة
        const targetRole = message.guild.roles.cache.get(targetID);
        if (targetRole) {
            await message.channel.send(`${targetRole}\n${text}`);
            return message.reply(`✅ تم المنشن للرتبة: ${targetRole.name}`);
        }

        return message.reply('❌ لم أجد روم أو رتبة بهذا الـ ID.');
    }
});

// --- التفاعل مع التذاكر (المنيو، المودال، الأزرار) ---
client.on('interactionCreate', async (interaction) => {
    
    // أولاً: القائمة المنسدلة
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم تحديث القائمة.', ephemeral: true });

        const modal = new ModalBuilder()
            .setCustomId(`modal_${choice}`)
            .setTitle(choice === 'buy' ? 'معلومات الشراء' : 'شرح المشكلة');

        if (choice === 'buy') {
            const item = new TextInputBuilder().setCustomId('item_type').setLabel('نوع الغرض').setStyle(TextInputStyle.Short).setRequired(true);
            const pay = new TextInputBuilder().setCustomId('pay_method').setLabel('طريقة التحويل').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(item), new ActionRowBuilder().addComponents(pay));
        } else {
            const issue = new TextInputBuilder().setCustomId('issue_text').setLabel('اشرح مشكلتك هنا').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(issue));
        }
        await interaction.showModal(modal);
    }

    // ثانياً: استقبال بيانات النوافذ (Modals)
    if (interaction.isModalSubmit()) {
        // حالة تغيير اسم التذكرة
        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('new_name');
            await interaction.channel.setName(newName);
            return interaction.reply({ content: `✅ تم تغيير اسم الروم إلى: **${newName}**` });
        }

        // حالة فتح تذكرة جديدة
        const type = interaction.customId.replace('modal_', '');
        await interaction.deferReply({ ephemeral: true });

        const channel = await interaction.guild.channels.create({
            name: `${type === 'buy' ? 'order' : 'support'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
            ],
        });

        const ticketEmbed = new EmbedBuilder().setColor(0x808080);
        if (type === 'buy') {
            ticketEmbed.setTitle('🛒 طلب شراء جديد')
                .addFields(
                    { name: 'نوع الغرض:', value: interaction.fields.getTextInputValue('item_type'), inline: true },
                    { name: 'طريقة التحويل:', value: interaction.fields.getTextInputValue('pay_method'), inline: true }
                );
        } else {
            ticketEmbed.setTitle('🛠️ دعم فني')
                .addFields({ name: 'المشكلة:', value: interaction.fields.getTextInputValue('issue_text') });
        }

        const btns = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير اسم التذكرة').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف التذكرة').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ 
            content: `<@${interaction.user.id}> | الإدارة <@&${ADMIN_ROLE_ID}>`, 
            embeds: [ticketEmbed], 
            components: [btns] 
        });

        await interaction.editReply(`✅ تم فتح تذكرتك: ${channel}`);
    }

    // ثالثاً: الأزرار
    if (interaction.isButton()) {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({ content: '❌ للأدمن فقط!', ephemeral: true });
        }

        if (interaction.customId === 'claim_ticket') {
            await interaction.channel.send(`🔒 استلم التذكرة: <@${interaction.user.id}>`);
            await interaction.reply({ content: 'تم الاستلام.', ephemeral: true });
        }

        if (interaction.customId === 'rename_btn') {
            const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير اسم التذكرة');
            const input = new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'delete_ticket') {
            const log = client.channels.cache.get(LOG_CHANNEL_ID);
            if (log) log.send(`🗑️ حُذفت تذكرة \`${interaction.channel.name}\` بواسطة ${interaction.user.tag}`);
            await interaction.reply('جاري الحذف...');
            setTimeout(() => interaction.channel.delete(), 2000);
        }
    }
});

// استدعاء التوكن من السكرت (Secrets)
client.login(process.env.TOKEN); 


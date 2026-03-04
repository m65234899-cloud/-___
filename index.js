const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, 
    ChannelType, PermissionFlagsBits, ModalBuilder, 
    TextInputBuilder, TextInputStyle 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// الإعدادات - تأكد من صحتها
const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

client.once('ready', () => console.log(`${client.user.tag} جاهز للعمل!`));

client.on('messageCreate', async (message) => {
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const embed = new EmbedBuilder()
            .setTitle('قائمة التذاكر')
            .setDescription('اختر من الخيارات الموجودة أدناه حسب المشكلة أو الطلب')
            .setColor(0x808080)
            .setImage(MAIN_IMAGE); // الصورة هنا فقط

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    { label: 'شراء غرض', description: 'للشراء افتح تذكرة من هنا', value: 'buy_order' },
                    { label: 'الدعم الفني', description: 'لديك مشكلة أو استفسار هنا', value: 'support' },
                    { label: 'تحديث القائمة', description: 'لتحديث قائمة الخيارات من هنا', value: 'refresh_menu' }
                ])
        );

        await message.channel.send({ embeds: [embed], components: [menu] });
    }
});

client.on('interactionCreate', async (interaction) => {
    
    // 1. فتح المودال عند اختيار خيار من المنيو
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh_menu') return interaction.reply({ content: 'تم تحديث القائمة.', ephemeral: true });

        const modal = new ModalBuilder()
            .setCustomId(`modal_${choice}`)
            .setTitle(choice === 'buy_order' ? 'معلومات الشراء' : 'الدعم الفني');

        if (choice === 'buy_order') {
            const itemType = new TextInputBuilder()
                .setCustomId('item_type').setLabel('نوع الغرض').setStyle(TextInputStyle.Short).setRequired(true);
            const paymentMethod = new TextInputBuilder()
                .setCustomId('payment_method').setLabel('طريقة التحويل').setStyle(TextInputStyle.Short).setRequired(true);
            
            modal.addComponents(new ActionRowBuilder().addComponents(itemType), new ActionRowBuilder().addComponents(paymentMethod));
        } else {
            const issue = new TextInputBuilder()
                .setCustomId('issue_text').setLabel('اشرح مشكلتك').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(issue));
        }

        await interaction.showModal(modal);
    }

    // 2. إنشاء التذكرة بعد تعبئة البيانات
    if (interaction.isModalSubmit()) {
        // حالة تغيير اسم التذكرة (للمسؤول)
        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('new_name');
            await interaction.channel.setName(newName);
            return interaction.reply({ content: `تم تغيير اسم التذكرة إلى: **${newName}**` });
        }

        // حالة فتح تذكرة جديدة
        const type = interaction.customId.split('_')[1];
        const channelName = `${type === 'buy' ? 'order' : 'support'}-${interaction.user.username}`;
        
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const ticketEmbed = new EmbedBuilder().setColor(0x808080);
        if (type === 'buy_order') {
            ticketEmbed.addFields(
                { name: 'نوع الغرض:', value: interaction.fields.getTextInputValue('item_type'), inline: true },
                { name: 'طريقة التحويل:', value: interaction.fields.getTextInputValue('payment_method'), inline: true }
            );
        } else {
            ticketEmbed.addFields({ name: 'المشكلة:', value: interaction.fields.getTextInputValue('issue_text') });
        }

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_ticket_btn').setLabel('تغيير اسم التذكرة').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف التذكرة').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${interaction.user.id}> | الإدارة <@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [buttons] });
        await interaction.reply({ content: `تم فتح تذكرتك: ${channel}`, ephemeral: true });
    }

    // 3. أزرار التحكم
    if (interaction.isButton()) {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: 'للإدارة فقط!', ephemeral: true });

        if (interaction.customId === 'claim_ticket') {
            await interaction.reply({ content: `تم استلام التذكرة بواسطة <@${interaction.user.id}>` });
        }

        if (interaction.customId === 'rename_ticket_btn') {
            const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير اسم الروم');
            const nameInput = new TextInputBuilder()
                .setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'delete_ticket') {
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) logChannel.send(`حذف تذكرة: ${interaction.channel.name} بواسطة ${interaction.user.tag}`);
            await interaction.reply('سيتم الحذف...');
            setTimeout(() => interaction.channel.delete(), 2000);
        }
    }
});

// استدعاء التوكن من السكرت (Secrets)
client.login(process.env.TOKEN); 


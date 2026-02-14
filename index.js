const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ID المستخدم المسؤول
const ADMIN_ID = '1472225010134421676';

// كاتقوري التذاكر
const TICKET_CATEGORY = '1467200518999900533';

// رابط الصورة المباشر
const TICKET_IMAGE = 'https://i.imgur.com/abcd123.png';

client.once('ready', () => console.log(`${client.user.tag} جاهز!`));

// رسالة التكت الأولية مع الخيارات
client.on('messageCreate', async message => {
    if (message.content === '!تكت' && !message.author.bot) {

        const embed = new EmbedBuilder()
            .setDescription('__حياك الله في المتجر افتح تكت وسيتم الرد عليك في اسرع وقت__')
            .setImage(TICKET_IMAGE)
            .setColor('Green');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('شراء_غرض')
                    .setLabel('شراء غرض')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('الدعم_الفني')
                    .setLabel('الدعم الفني')
                    .setStyle(ButtonStyle.Success)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// التعامل مع الضغط على الخيارات والأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // فتح تكت جديد عند الضغط على أي خيار
    if (interaction.customId === 'شراء_غرض' || interaction.customId === 'الدعم_الفني') {
        const category = interaction.guild.channels.cache.get(TICKET_CATEGORY);
        if (!category) return interaction.reply({ content: 'تعذر إيجاد الكاتقوري.', ephemeral: true });

        // إنشاء قناة التكت
        const ticketChannel = await interaction.guild.channels.create({
            name: `تكت-${interaction.user.username}`,
            type: 0, // Text channel
            parent: category.id,
            permissionOverwrites: [
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
                { id: ADMIN_ID, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] },
                { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] },
            ],
        });

        // Embed داخل التكت مع المنشن + الصورة
        const ticketEmbed = new EmbedBuilder()
            .setDescription(`مرحبا <@${interaction.user.id}> | <@&${ADMIN_ID}>`)
            .setImage(TICKET_IMAGE)
            .setColor('Green');

        const ticketRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('استلام_التذكره')
                    .setLabel('استلام التذكره')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('اغلاق_التذكره')
                    .setLabel('إغلاق التذكره')
                    .setStyle(ButtonStyle.Danger)
            );

        await ticketChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });

        await interaction.reply({ content: `تم فتح التكت: ${ticketChannel}`, ephemeral: true });
    }

    // استلام التكت
    if (interaction.customId === 'استلام_التذكره') {
        if (interaction.user.id !== ADMIN_ID) return interaction.reply({ content: 'انت ما تقدر تستخدم هذا الزر.', ephemeral: true });
        await interaction.reply({ content: 'تم استلام التذكره ✅', ephemeral: true });
    }

    // إغلاق التكت
    if (interaction.customId === 'اغلاق_التذكره') {
        if (interaction.user.id !== ADMIN_ID) return interaction.reply({ content: 'انت ما تقدر تستخدم هذا الزر.', ephemeral: true });
        await interaction.channel.delete();
    }
});

// تشغيل البوت باستخدام Secret
client.login(process.env.TOKEN);

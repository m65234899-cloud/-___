const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ID المستخدم اللي يقدر يستلم ويغلق التكت (انت)
const ADMIN_ID = '1472225010134421676';

// كاتقوري التذاكر
const TICKET_CATEGORY = '1467200518999900533';

// رابط الصورة المباشر
const TICKET_IMAGE = 'https://files.fm/thumb_show.php?i=fm86nxtzd2'; // أو رابط مباشر للصورة الكبيرة

client.once('ready', () => console.log(`${client.user.tag} جاهز!`));

client.on('messageCreate', async message => {
    if (message.content === '!تكت' && !message.author.bot) {

        const embed = new EmbedBuilder()
            .setDescription(`مرحبا <@${message.author.id}> | <@&${ADMIN_ID}>`) // منشن الشخص + الرتبة
            .setImage(TICKET_IMAGE)
            .setColor('Green');

        const row = new ActionRowBuilder()
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

        // إرسال التكت في كاتقوري محدد
        const category = message.guild.channels.cache.get(TICKET_CATEGORY);
        if (!category) return message.channel.send('تعذر إيجاد الكاتقوري.');

        const ticketChannel = await message.guild.channels.create({
            name: `تكت-${message.author.username}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
                { id: message.author.id, allow: ['ViewChannel', 'SendMessages'] },
                { id: ADMIN_ID, allow: ['ViewChannel', 'SendMessages', 'ManageChannels'] },
                { id: message.guild.roles.everyone.id, deny: ['ViewChannel'] },
            ],
        });

        await ticketChannel.send({ embeds: [embed], components: [row] });

        await message.reply({ content: `تم فتح التكت: ${ticketChannel}`, ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

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

// تشغيل البوت من Secret مباشرة
client.login(process.env.TOKEN);

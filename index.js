require('dotenv').config();  // تحميل متغيرات البيئة (تأكد أنك تستخدم dotenv إذا كانت البيئة لديك تحتوي على توكن)

const { Client, GatewayIntentBits, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextInputBuilder, ModalBuilder } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// عند تنفيذ الأمر !تكت
client.on('messageCreate', async (message) => {
  if (message.content === '!تكت') {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('اختار نوع التذكرى  من هنا')
      .setImage('https://cdn.discordapp.com/attachments/1473378884857630821/1477516185653481543/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a50bad&is=69a3ba2d&hm=2c1bed54842ee39c0f1e74da169657cd1751f575522cf3826308498da5fa4066&');

    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('menu_select')
        .setPlaceholder('اختار خدمة')
        .addOptions(
          { label: 'شراء غرض', value: 'buy_item' },
          { label: 'الدعم الفني', value: 'support' }
        )
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isSelectMenu()) return;

  const { customId, values } = interaction;

  if (customId === 'menu_select') {
    const selectedOption = values[0];

    if (selectedOption === 'buy_item') {
      // عرض النموذج للشراء مع الحقول المطلوبة
      const modal = new ModalBuilder()
        .setCustomId('buy_item_modal')
        .setTitle('شراء غرض');

      // الحقول المطلوبة
      const itemTypeInput = new TextInputBuilder()
        .setCustomId('item_type')
        .setLabel('نوع الغرض')
        .setStyle('SHORT')
        .setRequired(true);

      const transferMethodInput = new TextInputBuilder()
        .setCustomId('transfer_method')
        .setLabel('طريقة التحويل')
        .setStyle('SHORT')
        .setRequired(true);

      // ربط الحقول في صفوف
      const row1 = new ActionRowBuilder().addComponents(itemTypeInput);
      const row2 = new ActionRowBuilder().addComponents(transferMethodInput);

      modal.addComponents(row1, row2);

      await interaction.showModal(modal);

    } else if (selectedOption === 'support') {
      // عرض النموذج للدعم الفني
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('الدعم الفني')
        .setDescription('أدخل مشكلتك أو استفسارك أدناه');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('submit_support')
          .setLabel('إرسال')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.update({ embeds: [embed], components: [row] });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'buy_item_modal') {
      const itemType = interaction.fields.getTextInputValue('item_type');
      const transferMethod = interaction.fields.getTextInputValue('transfer_method');

      const member = interaction.member;
      const ticketName = `ticket-${member.user.username}`;
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: 'GUILD_TEXT',
        parent: '1473378884857630821', // ID القسم حيث سيتم إنشاء القنوات
      });

      // عرض التفاصيل في التذكرة
      const embed = new EmbedBuilder()
        .setColor('#0000ff')
        .setTitle('تذكرة شراء غرض')
        .setDescription('التفاصيل التالية:')
        .addFields(
          { name: 'نوع الغرض', value: itemType },
          { name: 'طريقة التحويل', value: transferMethod }
        );

      // إرسال التذكرة إلى القناة
      await ticketChannel.send({
        content: `<@1472225010134421676>`, // منشن للمسؤول
        embeds: [embed],
      });

      // خيارات إغلاق التذكرة
      const optionsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rename_ticket')
          .setLabel('إعادة التسمية')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('إغلاق التذكرة')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ components: [optionsRow] });
    }
  }

  // إغلاق التذكرة
  if (interaction.customId === 'close_ticket') {
    const ticketChannel = interaction.channel;
    ticketChannel.delete();
    // تسجيل اللوج في قناة اللوج
    const logChannel = await interaction.guild.channels.cache.get('1473378884857630821');
    logChannel.send(`تم إغلاق التذكرة: ${ticketChannel.name}`);
    await interaction.update({ content: 'تم إغلاق التذكرة.', components: [] });
  }

  // إعادة التسمية
  if (interaction.customId === 'rename_ticket') {
    const ticketChannel = interaction.channel;
    await ticketChannel.setName('new-ticket-name'); // يمكنك هنا تغيير الاسم
    await interaction.update({ content: 'تم تغيير اسم التذكرة.', components: [] });
  }
});

// استخدام التوكن من البيئة
client.login(process.env.TOKEN);

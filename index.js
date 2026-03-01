require('dotenv').config();  // تأكد من أنك تستخدم dotenv إذا كان التوكن في البيئة الخاصة بك

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
      .setColor('#808080')  // هنا تم تغيير اللون إلى اللون الرصاصي
      .setTitle('اختار الخدمة التي ترغب بها')
      .setImage('https://cdn.discordapp.com/attachments/1473378884857630821/1477516185653481543/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a50bad&is=69a3ba2d&hm=2c1bed54842ee39c0f1e74da169657cd1751f575522cf3826308498da5fa4066&')
      .setDescription('يرجى اختيار واحدة من الخيارات أدناه');

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
      // عرض نموذج "شراء غرض" مع حقول مرتبة
      const modal = new ModalBuilder()
        .setCustomId('buy_item_modal')
        .setTitle('شراء غرض');

      // الحقول المطلوبة
      const itemTypeInput = new TextInputBuilder()
        .setCustomId('item_type')
        .setLabel('ما هو طلبك؟')
        .setStyle('PARAGRAPH')
        .setRequired(true);

      const transferMethodInput = new TextInputBuilder()
        .setCustomId('transfer_method')
        .setLabel('ما هي طريقة الدفع؟ (ريال، كاش، ريزر، كريديتو، ...)')
        .setStyle('SHORT')
        .setRequired(true);

      const detailsInput = new TextInputBuilder()
        .setCustomId('details')
        .setLabel('تفاصيل طلبك')
        .setStyle('PARAGRAPH')
        .setRequired(true);

      // ربط الحقول في صفوف
      const row1 = new ActionRowBuilder().addComponents(itemTypeInput);
      const row2 = new ActionRowBuilder().addComponents(transferMethodInput);
      const row3 = new ActionRowBuilder().addComponents(detailsInput);

      modal.addComponents(row1, row2, row3);

      await interaction.showModal(modal);

    } else if (selectedOption === 'support') {
      // عرض نموذج "الدعم الفني"
      const embed = new EmbedBuilder()
        .setColor('#808080')  // تغيير اللون إلى اللون الرصاصي
        .setTitle('الدعم الفني')
        .setDescription('يرجى كتابة مشكلتك أو استفسارك في الحقول أدناه');

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
      const details = interaction.fields.getTextInputValue('details');

      const member = interaction.member;
      const ticketName = `ticket-${member.user.username}`;
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: 'GUILD_TEXT',
        parent: '1473378884857630821', // ID القسم حيث سيتم إنشاء القنوات
      });

      // عرض التفاصيل في التذكرة
      const embed = new EmbedBuilder()
        .setColor('#808080')  // اللون الرصاصي هنا أيضاً
        .setTitle('تذكرة شراء غرض')
        .setDescription('التفاصيل التالية:')
        .addFields(
          { name: 'ما هو طلبك؟', value: itemType },
          { name: 'طريقة الدفع', value: transferMethod },
          { name: 'تفاصيل الطلب', value: details }
        );

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

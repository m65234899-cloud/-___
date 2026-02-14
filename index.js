const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const ADMIN_ROLE_ID = "1472225010134421676"; // رتبة المشرفين
const TICKET_CATEGORY = "1467200518999900533";

const TICKET_IMAGE =
  "https://cdn.discordapp.com/attachments/1466506759966425119/1472239828925153314/image.png";

let ticketCounter = 1;

// تشغيل
client.once("ready", () => {
  console.log("✅ البوت شغال");
});


// رسالة البداية !تكت
client.on("messageCreate", async (message) => {
  if (message.content === "!تكت") {

    const embed = new EmbedBuilder()
      .setDescription("___ افتح تذكرة من هنا ___")
      .setImage(TICKET_IMAGE)
      .setColor("Secondary");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_buy")
        .setLabel("شراء غرض")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("الدعم الفني")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});


// فتح التكت
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // إنشاء تكت
  if (interaction.customId === "ticket_buy" || interaction.customId === "ticket_support") {

    let القسم =
      interaction.customId === "ticket_buy"
        ? "شراء غرض"
        : "الدعم الفني";

    // إنشاء قناة
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${ticketCounter}`,
      type: 0,
      parent: TICKET_CATEGORY,

      permissionOverwrites: [
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages"]
        },
        {
          id: ADMIN_ROLE_ID,
          allow: ["ViewChannel", "SendMessages"]
        },
        {
          id: interaction.guild.roles.everyone.id,
          deny: ["ViewChannel"]
        }
      ]
    });

    // Embed داخل التذكرة نفس الصورة
    const ticketEmbed = new EmbedBuilder()
      .setColor("Secondary")
      .setAuthor({
        name: "نظام التذاكر",
        iconURL: interaction.guild.iconURL()
      })
      .addFields(
        {
          name: "👤 مالك التذكرة",
          value: `<@${interaction.user.id}>`,
          inline: false
        },
        {
          name: "🛡 مشرفي التذاكر",
          value: `<@&${ADMIN_ROLE_ID}>`,
          inline: false
        },
        {
          name: "📅 تاريخ التذكرة",
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: false
        },
        {
          name: "🔢 رقم التذكرة",
          value: `${ticketCounter}`,
          inline: false
        },
        {
          name: "❓ قسم التذكرة",
          value: القسم,
          inline: false
        }
      )
      .setImage(TICKET_IMAGE);

    // أزرار الإدارة
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("استلام التذكرة")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("إغلاق التذكرة")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`,
      embeds: [ticketEmbed],
      components: [buttons]
    });

    await interaction.reply({
      content: `✅ تم فتح التذكرة: ${ticketChannel}`,
      ephemeral: true
    });

    ticketCounter++;
  }

  // استلام التذكرة (أي شخص معه الرتبة)
  if (interaction.customId === "claim_ticket") {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID))
      return interaction.reply({
        content: "❌ ما تقدر تستخدم الزر",
        ephemeral: true
      });

    await interaction.reply({
      content: "✅ تم استلام التذكرة",
      ephemeral: true
    });
  }

  // إغلاق التذكرة
  if (interaction.customId === "close_ticket") {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID))
      return interaction.reply({
        content: "❌ ما تقدر تستخدم الزر",
        ephemeral: true
      });

    await interaction.channel.delete();
  }
});

client.login(process.env.TOKEN);

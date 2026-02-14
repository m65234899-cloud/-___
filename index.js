const {
  Client,
  GatewayIntentBits,
  Partials,
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
  ],
  partials: [Partials.Channel]
});

const ADMIN_ROLE_ID = "1472225010134421676"; // رتبتك
const TICKET_CATEGORY = "1467200518999900533";

const TICKET_IMAGE = "https://cdn.discordapp.com/attachments/1466506759966425119/1472239828925153314/image.png";

client.once("ready", () => {
  console.log(`${client.user.tag} شغال تمام ✅`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!تكت" && !message.author.bot) {

    const embed = new EmbedBuilder()
      .setDescription("__حياك الله في المتجر افتح تكت وسيتم الرد عليك في اسرع وقت__")
      .setImage(TICKET_IMAGE)
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("شراء_غرض")
        .setLabel("شراء غرض")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("الدعم_الفني")
        .setLabel("الدعم الفني")
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (
    interaction.customId === "شراء_غرض" ||
    interaction.customId === "الدعم_الفني"
  ) {

    const ticketChannel = await interaction.guild.channels.create({
      name: `تكت-${interaction.user.username}`,
      type: 0,
      parent: TICKET_CATEGORY,

      permissionOverwrites: [
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages"]
        },
        {
          id: ADMIN_ROLE_ID,
          allow: ["ViewChannel", "SendMessages", "ManageChannels"]
        },
        {
          id: interaction.guild.roles.everyone.id,
          deny: ["ViewChannel"]
        }
      ]
    });

    const ticketEmbed = new EmbedBuilder()
      .setDescription(`مرحبا <@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`)
      .setImage(TICKET_IMAGE)
      .setColor("Green");

    const ticketButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("استلام_التذكره")
        .setLabel("استلام التذكره")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("اغلاق_التذكره")
        .setLabel("إغلاق التذكره")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      embeds: [ticketEmbed],
      components: [ticketButtons]
    });

    await interaction.reply({
      content: `✅ تم فتح التكت: ${ticketChannel}`,
      ephemeral: true
    });
  }


  if (interaction.customId === "استلام_التذكره") {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID))
      return interaction.reply({
        content: "❌ انت ما تقدر تستخدم هذا الزر.",
        ephemeral: true
      });

    await interaction.reply({
      content: "✅ تم استلام التذكره",
      ephemeral: true
    });
  }


  if (interaction.customId === "اغلاق_التذكره") {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID))
      return interaction.reply({
        content: "❌ انت ما تقدر تستخدم هذا الزر.",
        ephemeral: true
      });

    await interaction.channel.delete();
  }
});

client.login(process.env.TOKEN);

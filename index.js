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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const ADMIN_ROLE_ID = "1472225010134421676"; // رتبة المشرفين
const TICKET_CATEGORY = "1467200518999900533";

const TICKET_IMAGE =
  "https://cdn.discordapp.com/attachments/1466506759966425119/1472239828925153314/image.png";

let ticketCounter = 1;

client.once("ready", () => {
  console.log("✅ البوت شغال");
});

// ===================== الترحيب =====================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get("1472300112029028570");
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#00ffff")
    .setDescription(
      `➜ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ${member}\n\n➜ 𝐌𝐞𝐦𝐛𝐞𝐫𝐬－\`${member.guild.memberCount}\`\n\n➜ 𝐍𝐄𝐖𝐒`
    )
    .setImage(
      "https://cdn.discordapp.com/attachments/1472300112029028570/1472301503334060064/image.png"
    );

  channel.send({ embeds: [embed] });
});

// ===================== أوامر البوت =====================
client.on("messageCreate", async (message) => {

  // ===== !تكت =====
  if (message.content === "!تكت") {
    const embed = new EmbedBuilder()
      .setDescription("___ افتح تذكرة من هنا ___")
      .setImage(
        "https://cdn.discordapp.com/attachments/1467200591204843717/1473000214381199481/IMG_7628.png?ex=69949dda&is=69934c5a&hm=7093fcc765c309e13ee33cb3acfaa37398ded0024ee&"
      )
      .setColor("#000000");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_buy")
        .setLabel("شراء غرض")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("الدعم الفني")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== !ض =====
  if (message.content.startsWith("!ض")) {
    const args = message.content.split(" ");
    const member = message.mentions.users.first();
    if (!member) return message.reply("❌ لازم تمنشن شخص مثل: !ض @user 5m");
    if (!args[2]) return message.reply("❌ اكتب مبلغ مثل: !ض @user 5m");

    let amountStr = args[2].toLowerCase();
    let amount = 0;
    if (amountStr.endsWith("k")) amount = parseFloat(amountStr) * 1000;
    else if (amountStr.endsWith("m")) amount = parseFloat(amountStr) * 1000000;
    else amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return message.reply("❌ المبلغ غير صحيح");

    const finalAmount = Math.ceil(amount / 0.95);
    const tax = finalAmount - amount;
    const transferCommand = `c <@${member.id}> ${finalAmount}`;

    const embed = new EmbedBuilder()
      .setTitle("💳 حاسبة ضريبة VAULTA")
      .setColor("#00ffff")
      .setDescription(
        `👤 **المستلم:** ${member}\n\n` +
        `💰 **المبلغ المطلوب:** \`${amount.toLocaleString()}\`\n\n` +
        `🧾 **الضريبة (5%):** \`${tax.toLocaleString()}\`\n\n` +
        `✅ **لازم تحول:** \`${finalAmount.toLocaleString()}\`\n\n` +
        `📌 **أمر التحويل الجاهز:**\n\`\`\`${transferCommand}\`\`\``
      )
      .setFooter({ text: "نظام سيرفر VAULTA" });

    return message.channel.send({ embeds: [embed] });
  }

  // ===== !بوتات =====
  if (message.content === "!بوتات") {
    const embed = new EmbedBuilder()
      .setTitle(" اصنع بوتك الخاص من متجرنا🩶")
      .setDescription(
`### ارخص الأسعار لدينا بوت حسب طلبك  13 ريال

### بوت جاهز ب اختيارك وحنا نسويه لك 5 ريال

###  __C 5m__\nبوت حسب طلبك وتصميمك  

### __C 10m__\nبوت جاهز ب اختيارك.

حياك الله افتح تكت وموجودين دايماً <#1467200591204843717>`
      )
      .setImage("https://cdn.discordapp.com/attachments/1466506330822152406/1473027952097624074/IMG_7631.png?ex=6994b7af&is=6993662f&hm=9af6afcb3d0feb4007e78e2946eaeb82a3d20effc76e246cf21645f9e3648b2d&")
      .setColor("#000000");
    return message.channel.send({ embeds: [embed] });
  }

  // ===== !كريدت =====
  if (message.content === "!كريدت") {
    const embed = new EmbedBuilder()
      .setTitle(" __ اسعار الكريدت __")
      .setDescription(
`__C  1m__\n0.5 ريال سعودي
__C 5m__\n2.5 ريال سعودي
__C 10m__\n5.0 ريال سعودي
__C 15m__\n7.5 ريال سعودي

لشراء كريدت من هنا <#1467200591204843717>`
      )
      .setImage("https://cdn.discordapp.com/attachments/1472221936288272581/1473024074581147800/IMG_7632.png?ex=6994b412&is=69936292&hm=77e68dd22fcc121980a194445faaf7f1f2bd81c617db86ef5f8a57b0fe9b3a06&")
      .setColor("#000000");
    return message.channel.send({ embeds: [embed] });
  }

  // ===== !التصاميم =====
  if (message.content === "!التصاميم") {
    const embed = new EmbedBuilder()
      .setTitle(" اختر تصميمك بنفسك:")
      .setDescription(
`### • اختار الي تبي وحنا نجيبه لك :
تصميم سيرفر كامل __C 5m__

تصميم لوقو سيرفر__C 3m__

تصميم بنر سيرفر __C 2m__
أي شي ودك في افتح تذكرة : <#1467200591204843717>`
      )
      .setImage("https://cdn.discordapp.com/attachments/1466506501479989615/1473029400202051636/IMG_7633.png?ex=6994b908&is=69936788&hm=e04fea6ee08ff07b69e5590189882724f89019486b6530108cf7eb8a86447189&")
      .setColor("#000000");
    return message.channel.send({ embeds: [embed] });
  }

});

// ===================== فتح التكت =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "ticket_buy" || interaction.customId === "ticket_support") {
    let القسم = interaction.customId === "ticket_buy" ? "شراء غرض" : "الدعم الفني";

    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${ticketCounter}`,
      type: 0,
      parent: TICKET_CATEGORY,
      permissionOverwrites: [
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
        { id: ADMIN_ROLE_ID, allow: ["ViewChannel", "SendMessages"] },
        { id: interaction.guild.roles.everyone.id, deny: ["ViewChannel"] }
      ]
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor("#000000")
      .setAuthor({ name: "نظام التذاكر", iconURL: interaction.guild.iconURL() })
      .addFields(
        { name: "👤 مالك التذكرة", value: `<@${interaction.user.id}>`, inline: false },
        { name: "🛡 مشرفي التذاكر", value: `<@&${ADMIN_ROLE_ID}>`, inline: false },
        { name: "📅 تاريخ التذكرة", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: "🔢 رقم التذكرة", value: `${ticketCounter}`, inline: false },
        { name: "❓ قسم التذكرة", value: القسم, inline: false }
      )
      .setImage(
        interaction.customId === "ticket_buy"
          ? "https://cdn.discordapp.com/attachments/1466506759966425119/1472995599509880977/DEF6F242-58F4-4BFB-9315-BD0DF84E3122.png?ex=6994998d&is=6993480d&hm=8166d9d568bc11c91bebddd724e632451798d65818ea8c058e9263117559dae0&"
          : "https://cdn.discordapp.com/attachments/1466506759966425119/1E532655-FB80-42D4-B00C-8E74273084CA.png?ex=699499d3&is=69934853&hm=1a53f942402754998fc2f7ab9cf695605a46d419e8008c923b62bc60798e305d&"
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim_ticket").setLabel("استلام التذكرة").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("close_ticket").setLabel("إغلاق التذكرة").setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [buttons] });
    await interaction.reply({ content: `✅ تم فتح التذكرة: ${ticketChannel}`, ephemeral: true });
    ticketCounter++;
  }

  if (interaction.customId === "claim_ticket") {
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: "❌ ما تقدر تستخدم الزر", ephemeral: true });
    await interaction.reply({ content: "✅ تم استلام التذكرة", ephemeral: true });
  }

  if (interaction.customId === "close_ticket") {
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: "❌ ما تقدر تستخدم الزر", ephemeral: true });
    await interaction.channel.delete();
  }
});

client.login(process.env.TOKEN);

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
    .setColor("#000000")
    .setDescription(
      `➜ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ${member}\n\n➜ 𝐌𝐞𝐦𝐛𝐞𝐫𝐬－\`${member.guild.memberCount}\`\n\n➜ 𝐍𝐄𝐖𝐒`
    )
    .setImage(
      "https://cdn.discordapp.com/attachments/1472300112029028570/1473041874574119064/IMG_7634.png?ex=6994c4a6&is=69937326&hm=4aa49e309aa160101a3ac918b925fe077bbc5f3e700bec534dc8ab7c9d0ab07b&"
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
    // ===================== نظام الآراء =====================
  const FEEDBACK_CHANNEL_ID = "1466506862760431882";

  if (message.channel.id === FEEDBACK_CHANNEL_ID) {
    // تجاهل رسائل البوتات
    if (message.author.bot) return;

    // حفظ نص الرأي
    const feedback = message.content;

    // حذف رسالة الشخص
    await message.delete();

    // إرسال الرأي بشكل Embed
    const embed = new EmbedBuilder()
      .setColor("#000000") // أسود
      .setThumbnail(message.guild.iconURL({ dynamic: true })) // شعار السيرفر فوق يمين
      .setTitle("📢 رأي جديد")
      .setDescription(
        `**رأي الشخص هنا |** ${message.author}\n\n` +
        `**الرأي الخاص به |** ${feedback}`
      )
      .setFooter({ text: "نظام الآراء - VAULTA" });

    // إرسال الإيمبد
    const sentMessage = await message.channel.send({ embeds: [embed] });

    // إضافة تقييم واحد فقط 🩶
    await sentMessage.react("🩶");
  }
// ===== !تحويل =====
if (message.content === "!تحويل") {
  const embed = new EmbedBuilder()
    .setTitle("💳 رقم الآيبان للتحويل")
    .setDescription("SA35 8000 0400 6080 1604 4543")
    .setColor("#000000");
  return message.channel.send({ embeds: [embed] });
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
      .setColor("#000000")
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
// ===================== أمر !س =====================
if (message.content.startsWith("!س")) {
  const args = message.content.split(" ");
  if (!args[1]) return message.reply("❌ اكتب المبلغ مثل: !س 100m");

  let input = args[1].toLowerCase();
  let amount = 0;

  // دعم k / m
  if (input.endsWith("m")) {
    amount = parseFloat(input) * 1; // كل مليون واحد
  } else if (input.endsWith("k")) {
    amount = parseFloat(input) / 1000; // 1000k = 1m
  } else {
    amount = parseFloat(input);
  }

  if (isNaN(amount) || amount <= 0) return message.reply("❌ المبلغ غير صحيح");

  // 1M = 0.5 ريال
  const price = amount * 0.55;

  return message.reply(`💰 سعر ${args[1]} = ${price.toLocaleString()} ريال سعودي`);
}
  // ===== !بوتات =====
  if (message.content === "!بوتات") {
    const embed = new EmbedBuilder()
      .setTitle(" اصنع بوتك الخاص من متجرنا🩶")
      .setDescription(
`### ارخص الأسعار لدينا بوت حسب طلبك  13 ريال

### بوت جاهز ب اختيارك وحنا نسويه لك 5 ريال

حياك الله افتح تكت وموجودين دايماً <#1467200591204843717>`
      )
      .setImage("https://cdn.discordapp.com/attachments/1473378884857630821/1474544465405546629/IMG_7631.png?ex=699a3c0c&is=6998ea8c&hm=f7a68a3664ecf40aa48c5a1283416fcc6bd0c969a4da312bf99c0ed4a4c8560c&")
      .setColor("#000000");
    return message.channel.send({ embeds: [embed] });
  }

  // ===== !كريدت =====
  if (message.content === "!كريدت") {
    const embed = new EmbedBuilder()
      .setTitle(" __ اسعار الكريدت __")
      .setDescription(
`__C  1m__\n0.55 ريال سعودي
__C 5m__\n2.75 ريال سعودي
__C 10m__\n5.5 ريال سعودي
__C 15m__\n8.25 ريال سعودي

لشراء كريدت من هنا <#1467200591204843717>`
      )
      .setImage("https://cdn.discordapp.com/attachments/1473378884857630821/1474544464763551925/IMG_7632.png?ex=699a3c0c&is=6998ea8c&hm=8311980f30ae6ef28d86d73bcec6cce50000921f4c8ef854b19da3e0e03aff3c&")
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
      .setImage("https://cdn.discordapp.com/attachments/1473378884857630821/1474544465057415270/IMG_7633.png?ex=699a3c0c&is=6998ea8c&hm=db2e209e2b9efcdda85d30da1ff8d1f2902e5e0986abaadeefa14be970005dcb&")
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
          ? "https://cdn.discordapp.com/attachments/1473378884857630821/1474545943192928379/DEF6F242-58F4-4BFB-9315-BD0DF84E3122.png?ex=699a3d6c&is=6998ebec&hm=601956ea7d84bb43a1a3c1ab12384a91476a28a66bedbb1c05ebfad508b4082d&"
          : "https://i.postimg.cc/tJ30pLtD/1E532655-FB80-42D4-B00C-8E74273084CA.png"
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

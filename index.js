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

// تشغيل
client.once("ready", () => {
  console.log("✅ البوت شغال");
});

// ===================== بوت الترحيب =====================
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get("1472300112029028570"); // روم الترحيب
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

// ===================== رسالة البداية !تكت =====================
client.on("messageCreate", async (message) => {
  if (message.content === "!تكت") {

    const embed = new EmbedBuilder()
      .setDescription("___ افتح تذكرة من هنا ___")
      .setImage("https://cdn.discordapp.com/attachments/1467200591204843717/1473000214381199481/IMG_7628.png?ex=69949dda&is=69934c5a&hm=7093fcc765c309e13ee33cb3acfaa37398ded0024ee&")
      .setColor("#000000");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_buy")
        .setLabel("شراء غرض")
        .setStyle(ButtonStyle.Secondary), // رمادي
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("الدعم الفني")
        .setStyle(ButtonStyle.Secondary) // رمادي
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  // ===================== أمر الضريبة بروبوت مع منشن !ض =====================
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
        { id: interaction.guild.roles.everyone.id, deny: ["ViewChannel"] },
      ],
    });

    // ===== الكلام أول شيء =====
    await ticketChannel.send(`**${القسم}**`);

    // ===== استبيان شراء الغرض =====
    let answers = [];
    if (interaction.customId === "ticket_buy") {
      const filter = (m) => m.author.id === interaction.user.id;
      const questions = ["نوع الغرض:", "طريقة التحويل:", "المبلغ:"];
      for (let i = 0; i < questions.length; i++) {
        await ticketChannel.send(questions[i]);
        const collected = await ticketChannel.awaitMessages({ filter, max: 1, time: 300000 });
        answers.push(collected.size > 0 ? collected.first().content : "-");
      }
    }

    // ===== بعد الاستبيان الصورة =====
    const ticketEmbed = new EmbedBuilder()
      .setColor("#000000")
      .setImage(interaction.customId === "ticket_buy" ? 
        "https://cdn.discordapp.com/attachments/1466506759966425119/1472995599509880977/DEF6F242-58F4-4BFB-9315-BD0DF84E3122.png?ex=6994998d&is=6993480d&hm=8166d9d568bc11c91bebddd724e632451798d65818ea8c058e9263117559dae0&"
        : "https://cdn.discordapp.com/attachments/1466506759966425119/1472995890016030920/1E532655-FB80-42D4-B00C-8E74273084CA.png?ex=699499d3&is=69934853&hm=1a53f942402754998fc2f7ab9cf695605a46d419e8008c923b62bc60798e305d&");

    if (interaction.customId === "ticket_buy") {
      ticketEmbed.addFields({
        name: "📋 بيانات الطلب:",
        value: `**نوع الغرض:** ${answers[0]}\n**طريقة التحويل:** ${answers[1]}\n**المبلغ:** ${answers[2]}`,
      });
    }

    // ===== أزرار الإدارة =====
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

  // استلام التذكرة
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

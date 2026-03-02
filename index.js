const { Client, GatewayIntentBits, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
require('dotenv').config();

// تحميل التوكن من ملف .env
const token = process.env.DISCORD_TOKEN;

// إنشاء العميل
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// قاعدة بيانات وهمية للتذاكر
let tickets = {};

// دالة لإنشاء التذكرة
async function createTicket(interaction, ticketType) {
  const ticketId = Object.keys(tickets).length + 1;
  let description;
  let choices;
  let imageUrl = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a714e6&is=69a5c366&hm=ba5bf3ff6018016346700b141f7b0527218b7ad9828e5ccd874198942f69b85a&";

  if (ticketType === "شراء") {
    description = "يرجى تحديد طريقة الدفع وتفاصيل الطلب.";
    choices = ["STC", "الاهلي", "برق", "الدفع عند الاستلام"];
  } else if (ticketType === "دعم فني") {
    description = "يرجى شرح مشكلتك بالتفصيل.";
    choices = ["مشكلة في الحساب", "مشكلة في التطبيق", "مشكلة فنية أخرى"];
  } else if (ticketType === "تحديث القائمة") {
    description = "تحديث خيارات التذاكر.";
    choices = ["إضافة خيارات", "حذف خيارات", "تعديل خيارات"];
  }

  // إعداد القوائم التفاعلية
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder('اختر خيارًا...')
    .addOptions(
      choices.map(choice => ({ label: choice, value: choice }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  // حفظ التذكرة
  tickets[ticketId] = {
    user: interaction.user.username,
    ticketType,
    description,
    status: 'مفتوحة',
    selectedOption: null,
    imageUrl
  };

  // إرسال الرسالة مع واجهة الاختيارات
  await interaction.reply({
    content: `تم إنشاء تذكرة من نوع ${ticketType}.\n${description}`,
    components: [row]
  });
}

// الحدث عند جاهزية البوت
client.once('ready', () => {
  console.log(`تم تسجيل الدخول كـ ${client.user.tag}`);
});

// الحدث عند تفاعل المستخدم مع البوت
client.on('interactionCreate', async interaction => {
  if (!interaction.isSelectMenu()) return;

  if (interaction.customId === 'ticket_select') {
    const selectedOption = interaction.values[0];
    const ticketId = Object.keys(tickets).length;  // تفترض أن التذكرة هي آخر تذكرة تم إنشاؤها
    tickets[ticketId].selectedOption = selectedOption;

    await interaction.update({ content: `تم اختيار: ${selectedOption}` });
  }
});

// استقبال الأمر `!تكت` لإنشاء التذكرة
client.on('messageCreate', async message => {
  if (message.content === '!تكت') {
    // إرسال خيارات التذكرة للمستخدم
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select_type')
      .setPlaceholder('اختر نوع التذكرة')
      .addOptions([
        { label: 'شراء غرض', value: 'شراء' },
        { label: 'دعم فني', value: 'دعم فني' },
        { label: 'تحديث القائمة', value: 'تحديث القائمة' }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await message.reply({
      content: 'يرجى اختيار نوع التذكرة:',
      components: [row]
    });
  }
});

// تسجيل الدخول بالبوت
client.login(token);

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// تهيئة البوت
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// معرف الفاوندر أو الأشخاص ذوي الصلاحية
const SPECIAL_ROLE_ID = '1472225010134421676';

// إنشاء نموذج الطلبات
class RequestModal {
    static create() {
        return new ModalBuilder()
            .setCustomId('requestModal')
            .setTitle('طلب تذكرة')
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('requestInput')
                    .setLabel('ما هو طلبك؟')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true),
                new TextInputBuilder()
                    .setCustomId('paymentInput')
                    .setLabel('طريقة دفعك (STC, بطاقة, إلخ)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            );
    }
}

// إنشاء نموذج الدعم الفني
class SupportModal {
    static create() {
        return new ModalBuilder()
            .setCustomId('supportModal')
            .setTitle('الدعم الفني')
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('supportInput')
                    .setLabel('أشرح مشكلتك')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
            );
    }
}

// التعامل مع التفاعل مع الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'requests') {
        const modal = RequestModal.create();
        await interaction.showModal(modal);
    } else if (interaction.customId === 'support') {
        const modal = SupportModal.create();
        await interaction.showModal(modal);
    } else if (interaction.customId === 'close') {
        await interaction.reply({ content: 'تم إغلاق التذكرة.', ephemeral: true });
        await interaction.message.delete();
    }
});

// التعامل مع المدخلات في النماذج
client.on('modalSubmit', async interaction => {
    if (interaction.customId === 'requestModal') {
        const request = interaction.fields.getTextInputValue('requestInput');
        const payment = interaction.fields.getTextInputValue('paymentInput');
        await interaction.reply({ content: `تم تقديم التذكرة بنجاح! \nطلبك: ${request} \nطريقة الدفع: ${payment}`, ephemeral: true });
    } else if (interaction.customId === 'supportModal') {
        const support = interaction.fields.getTextInputValue('supportInput');
        await interaction.reply({ content: `تم تقديم تذكرة الدعم الفني بنجاح! \nالمشكلة: ${support}`, ephemeral: true });
    }
});

// أمر التكت
client.on('messageCreate', async message => {
    if (message.content === '!تكت') {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('requests')
                    .setLabel('الطلبات')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('support')
                    .setLabel('الدعم الفني')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({
            content: 'اختار الخدمة المطلوبة:',
            components: [row],
        });
    }
});

// تشغيل البوت
client.login('TOKEN');  // استبدل بـ توكن البوت الخاص بك

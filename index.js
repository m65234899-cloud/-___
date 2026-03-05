const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- [ الإعدادات الكاملة والقيم الثابتة ] ---

const TOKEN = process.env.TOKEN; 

const ADMIN_ROLE_ID = '1472225010134421676';

const LOG_CHANNEL_ID = '1473378884857630821';

const BUY_CATEGORY_ID = '1478604299549544601'; 

const SUPPORT_CATEGORY_ID = '1477992348033093683'; 

const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1;

const invoices = new Map(); // قاعدة بيانات مؤقتة للفواتير

// --- [ الدوال المساعدة للنظام ] ---

function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 
        'k': 1000, 
        'm': 1000000, 
        'b': 1000000000 
    };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) {
        return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    }
    return parseInt(str);
}

// --- [ أحداث تشغيل البوت ] ---

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- أمر إنشاء قائمة التذاكر الرئيسية ---
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const ticketEmbed = new EmbedBuilder()
            .setTitle('مركز المساعدة والطلبات')
            .setDescription('مرحباً بك في المركز الخاص بنا، يرجى اختيار القسم المناسب لمشكلتك أو طلبك من القائمة المنسدلة في الأسفل.')
            .setColor(0x808080)
            .setImage(MAIN_IMAGE)
            .setFooter({ text: 'نحن هنا لخدمتك دائماً' });

        const selectionMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إختر نوع التذكرة التي ترغب بفتحها')
                .addOptions([
                    { label: 'قسم المبيعات والشراء', value: 'buy_option' },
                    { label: 'قسم الدعم الفني', value: 'support_option' },
                    { label: 'تحديث القائمة', value: 'refresh' }
                ])
        );
        await message.channel.send({ embeds: [ticketEmbed], components: [selectionMenu] });
    }

    // --- أمر عرض الفاتورة بكامل التفاصيل ---
    if (message.content.startsWith('!فاتورة')) {
        const args = message.content.split(/ +/);
        const invoiceNumber = args[1];
        
        if (!invoiceNumber) return message.reply("⚠️ يرجى تزويدنا برقم الفاتورة.");
        
        const data = invoices.get(invoiceNumber);
        if (!data) return message.reply("❌ لم يتم العثور على الفاتورة.");

        const detailedInvoiceEmbed = new EmbedBuilder()
            .setTitle(`تفاصيل فاتورة الشراء #${invoiceNumber}`)
            .setColor(0x2ecc71)
            .addFields(
                { name: '👤 العميل:', value: `${data.userName}`, inline: true },
                { name: '📦 المنتج:', value: `${data.itemName}`, inline: false },
                { name: '📅 التاريخ:', value: `${data.date}`, inline: false }
            )
            .setTimestamp();

        await message.channel.send({ embeds: [detailedInvoiceEmbed] });
    }

    // --- أمر توجيه طلب شراء لعضو محدد (!y) ---
    if (message.content.startsWith('!y')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.split(/ +/);
        const targetID = args[1];
        
        await message.delete().catch(() => null);
        if (!targetID) return;
        
        const targetUser = await client.users.fetch(targetID).catch(() => null);
        if (!targetUser) return;

        const purchaseEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('تأكيد عملية الشراء')
            .setDescription(`عزيزي العميل ${targetUser}، يرجى الضغط على الزر أدناه لتأكيد عملية الشراء الخاصة بك.`);

        const actionButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`open_modal_${targetID}`).setLabel('تأكيد وإتمام الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancel_${targetID}`).setLabel('إلغاء العملية').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [purchaseEmbed], components: [actionButtons] });
    }

    // --- أمر حساب الضريبة (!tax) ---
    if (message.content.startsWith('!tax')) {
        const args = message.content.split(/ +/);
        if (args[1]) {
            const price = parseAmount(args[1]);
            if (!isNaN(price)) {
                const finalAmount = Math.floor(price / 0.95) + 1;
                await message.channel.send(`المبلغ الإجمالي مع الضريبة هو: **${finalAmount}**`);
            }
        }
    }
});

// --- [ التعامل مع التفاعلات (Interactions) ] ---

client.on('interactionCreate', async (interaction) => {

    // 1. القائمة المنسدلة للتكت
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم التحديث.', ephemeral: true });

        const ticketModal = new ModalBuilder().setCustomId(`modal_${choice}`).setTitle('تفاصيل التذكرة');

        if (choice === 'buy_option') {
            const itemField = new TextInputBuilder().setCustomId('item_field').setLabel('ما هو نوع الغرض؟').setStyle(TextInputStyle.Short).setRequired(true);
            const payField = new TextInputBuilder().setCustomId('pay_field').setLabel('ما هي طريقة الدفع؟').setStyle(TextInputStyle.Short).setRequired(true);
            ticketModal.addComponents(new ActionRowBuilder().addComponents(itemField), new ActionRowBuilder().addComponents(payField));
        } else {
            const issueField = new TextInputBuilder().setCustomId('issue_field').setLabel('يرجى وصف مشكلتك').setStyle(TextInputStyle.Paragraph).setRequired(true);
            ticketModal.addComponents(new ActionRowBuilder().addComponents(issueField));
        }
        await interaction.showModal(ticketModal);
    }

    // 2. معالجة إرسال المودال (إنشاء التذكرة بالشكل المطلوب)
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.replace('modal_', '');
        const isBuy = type === 'buy_option';

        const ticketChannel = await interaction.guild.channels.create({
            name: `${isBuy ? 'طلب' : 'دعم'}-${interaction.user.username}`,
            parent: isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const val1 = isBuy ? interaction.fields.getTextInputValue('item_field') : interaction.fields.getTextInputValue('issue_field');
        const val2 = isBuy ? interaction.fields.getTextInputValue('pay_field') : null;

        // --- التنسيق النصي داخل الـ Embed (تطابق الصور) ---
        const ticketEmbed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setTitle(`Twins Store Support Ticket`)
            .setDescription(`يرجى انتظار الدعم الفني لتلقي استفسارك\n\n**${isBuy ? 'ما هو طلبك؟' : 'وصف المشكلة:'}**\n${val1}\n\n${isBuy ? `**طريقة دفعك**\n${val2}` : ''}`)
            .setFooter({ text: `تذكرة العميل: ${interaction.user.tag}` });

        const controlButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('delete_btn').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير الاسم').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success)
        );

        const remindRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('remind_btn').setLabel('تذكير العضو').setStyle(ButtonStyle.Secondary)
        );

        await ticketChannel.send({ 
            content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, 
            embeds: [ticketEmbed], 
            components: [controlButtons, remindRow] 
        });

        await interaction.editReply(`✅ تم إنشاء تذكرتك: ${ticketChannel}`);
    }

    // 3. أزرار التحكم في التذاكر
    if (interaction.isButton()) {
        const { customId, member, channel } = interaction;
        
        if (['claim_btn', 'delete_btn', 'rename_btn', 'remind_btn'].includes(customId)) {
            if (!member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: "❌ للإدارة فقط.", ephemeral: true });

            if (customId === 'claim_btn') {
                await channel.send({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setDescription(`🔒 تم الاستلام بواسطة: ${interaction.user}`)] });
            }
            if (customId === 'delete_btn') {
                await interaction.reply("⚠️ جاري الحذف...");
                setTimeout(() => channel.delete(), 3000);
            }
            if (customId === 'remind_btn') {
                await channel.send(`🔔 تذكير للعميل: يرجى الرد لإتمام طلبك.`);
            }
        }
    }
});

client.login(TOKEN);

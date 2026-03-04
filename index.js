const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, 
    ChannelType, PermissionFlagsBits, ModalBuilder, 
    TextInputBuilder, TextInputStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

// --- الإعدادات الكاملة ---
const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const BUY_CATEGORY_ID = '1478604299549544601'; 
const SUPPORT_CATEGORY_ID = '1477992348033093683'; 
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1;
const invoices = new Map(); // قاعدة بيانات مؤقتة للفواتير

function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    return parseInt(str);
}

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- أمر إنشاء قائمة التذاكر ---
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
                    { label: 'قسم المبيعات والشراء', description: 'لطلب شراء الأغراض أو المنتجات الخاصة بنا', value: 'buy_option' },
                    { label: 'قسم الدعم الفني', description: 'إذا واجهت مشكلة تقنية أو لديك استفسار عام', value: 'support_option' },
                    { label: 'تحديث القائمة', description: 'تنشيط وتحديث خيارات القائمة', value: 'refresh' }
                ])
        );
        await message.channel.send({ embeds: [ticketEmbed], components: [selectionMenu] });
    }

    // --- أمر عرض الفاتورة بكامل التفاصيل ---
    if (message.content.startsWith('!فاتورة')) {
        const args = message.content.split(/ +/);
        const invoiceNumber = args[1];
        
        if (!invoiceNumber) return message.reply("⚠️ يرجى تزويدنا برقم الفاتورة المراد البحث عنها. مثال: `!فاتورة 1`").then(m => setTimeout(() => m.delete(), 5000));
        
        const data = invoices.get(invoiceNumber);
        if (!data) return message.reply("❌ عذراً، لم نتمكن من العثور على أي فاتورة مسجلة بهذا الرقم في نظامنا.").then(m => setTimeout(() => m.delete(), 5000));

        const detailedInvoiceEmbed = new EmbedBuilder()
            .setTitle(`تفاصيل فاتورة الشراء الرقمية #${invoiceNumber}`)
            .setColor(0x2ecc71)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '👤 اسم العميل:', value: `${data.userName}`, inline: true },
                { name: '🆔 آيدي العميل:', value: `\`${data.userId}\``, inline: true },
                { name: '📦 نوع الغرض المشتراة:', value: `${data.itemName}`, inline: false },
                { name: '📅 تاريخ ووقت العملية:', value: `${data.date}`, inline: false },
                { name: '🔢 رقم العملية التسلسلي:', value: `#${invoiceNumber}`, inline: true }
            )
            .setFooter({ text: 'شكراً لتعاملك معنا' })
            .setTimestamp();

        await message.channel.send({ embeds: [detailedInvoiceEmbed] });
    }

    // --- أمر توجيه طلب شراء لعميل محدد ---
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
            .setDescription(`عزيزي العميل ${targetUser}، يرجى الضغط على الزر أدناه لتأكيد عملية الشراء الخاصة بك.\n\n**تنبيه:** بضغطك على الزر أنت توافق على قوانين المتجر ونحن غير مسؤولين عن سوء الاستخدام.`);

        const actionButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`open_modal_${targetID}`).setLabel('تأكيد وإتمام الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancel_${targetID}`).setLabel('إلغاء العملية').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [purchaseEmbed], components: [actionButtons] });
    }

    // --- أمر حساب الضريبة ---
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

client.on('interactionCreate', async (interaction) => {
    // --- التعامل مع الأزرار ---
    if (interaction.isButton()) {
        const customId = interaction.customId;

        // أزرار الشراء (حماية: للعميل الموجه له فقط)
        if (customId.startsWith('open_modal_')) {
            const targetId = customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ عذراً، هذا الزر مخصص فقط للعميل صاحب الطلب.", ephemeral: true });

            const orderModal = new ModalBuilder().setCustomId(`submit_order_${targetId}`).setTitle('تفاصيل الغرض المشتراة');
            const itemInput = new TextInputBuilder()
                .setCustomId('order_item_name')
                .setLabel('ما هو نوع الغرض الذي ترغب بشرائه؟')
                .setPlaceholder('مثال: رتبة بريميوم، 5000 عملة، غرض خاص...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            orderModal.addComponents(new ActionRowBuilder().addComponents(itemInput));
            return await interaction.showModal(orderModal);
        }

        if (customId.startsWith('cancel_')) {
            const targetId = customId.split('_')[1];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر مخصص فقط للعميل صاحب الطلب.", ephemeral: true });
            return await interaction.update({ content: `❌ تم إلغاء عملية الشراء بواسطة العميل: ${interaction.user}`, embeds: [], components: [] });
        }

        // أزرار التكت (حماية: للإدارة فقط)
        const adminOnlyButtons = ['claim_btn', 'rename_btn', 'delete_btn'];
        if (adminOnlyButtons.includes(customId)) {
            if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
                return interaction.reply({ content: "❌ عذراً، هذه الصلاحية مخصصة فقط لأعضاء فريق الإدارة.", ephemeral: true });
            }

            if (customId === 'claim_btn') {
                await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setDescription(`🔒 تم استلام هذه التذكرة بواسطة الإداري: ${interaction.user}`)] });
            }
            if (customId === 'rename_btn') {
                const renameModal = new ModalBuilder().setCustomId('rename_modal').setTitle('تعديل اسم القناة');
                const nameInput = new TextInputBuilder().setCustomId('new_name_field').setLabel('أدخل الاسم الجديد للتذكرة').setStyle(TextInputStyle.Short).setRequired(true);
                renameModal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                await interaction.showModal(renameModal);
            }
            if (customId === 'delete_btn') {
                await interaction.reply({ content: "⚠️ جاري إغلاق وحذف التذكرة نهائياً خلال 3 ثوانٍ..." });
                setTimeout(() => interaction.channel.delete(), 3000);
            }
            return;
        }
    }

    // --- التعامل مع إرسال المودالات (Modals) ---
    if (interaction.isModalSubmit()) {
        // مودال تأكيد الشراء النهائي
        if (interaction.customId.startsWith('submit_order_')) {
            const targetId = interaction.customId.split('_')[2];
            const itemName = interaction.fields.getTextInputValue('order_item_name');
            const currentOrderNum = orderCounter++;

            // تخزين البيانات كاملة
            invoices.set(currentOrderNum.toString(), {
                userId: targetId,
                userName: interaction.user.username,
                itemName: itemName,
                date: new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' })
            });

            await interaction.update({ content: `✅ تم إتمام عملية الشراء بنجاح!\nالغرض: **${itemName}**\nرقم الفاتورة: **#${currentOrderNum}**`, embeds: [], components: [] });

            // إرسال الفاتورة المفصلة لخاص العميل
            try {
                const privateInvoice = new EmbedBuilder()
                    .setTitle('وصل شراء إلكتروني')
                    .setColor(0x2ecc71)
                    .setDescription(`شكراً لك على ثقتك بنا، تم تسجيل عملية الشراء بنجاح وهذه هي التفاصيل الخاصة بك:`)
                    .addFields(
                        { name: '📦 المنتج:', value: `${itemName}`, inline: true },
                        { name: '🔢 رقم الفاتورة:', value: `#${currentOrderNum}`, inline: true },
                        { name: '🕒 تاريخ العملية:', value: `${new Date().toLocaleString('ar-EG')}`, inline: false }
                    );
                await interaction.user.send({ embeds: [privateInvoice] });
            } catch (error) {
                console.log("تعذر إرسال رسالة خاصة للعميل.");
            }

            // إرسال اللوج للإدارة
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x2ecc71)
                    .setTitle('سجل فواتير جديد')
                    .addFields(
                        { name: 'رقم الفاتورة:', value: `#${currentOrderNum}`, inline: true },
                        { name: 'العميل:', value: `${interaction.user.tag}`, inline: true },
                        { name: 'الغرض المشتراة:', value: `${itemName}`, inline: false }
                    ).setTimestamp();
                await logChannel.send({ embeds: [logEmbed] });
            }
        }

        // مودال تغيير اسم التذكرة
        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('new_name_field');
            await interaction.channel.setName(newName);
            return interaction.reply({ content: `✅ تم تغيير اسم القناة بنجاح إلى: **${newName}**` });
        }
    }

    // --- القائمة المنسدلة للتكت ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم تحديث بيانات القائمة بنجاح.', ephemeral: true });

        const ticketModal = new ModalBuilder()
            .setCustomId(`modal_${choice}`)
            .setTitle(choice === 'buy_option' ? 'تفاصيل طلب الشراء' : 'تفاصيل الدعم الفني');

        if (choice === 'buy_option') {
            const itemField = new TextInputBuilder().setCustomId('item_field').setLabel('ما هو الشيء الذي ترغب بشرائه؟').setStyle(TextInputStyle.Short).setRequired(true);
            const payField = new TextInputBuilder().setCustomId('pay_field').setLabel('ما هي طريقة الدفع المفضلة لديك؟').setStyle(TextInputStyle.Short).setRequired(true);
            ticketModal.addComponents(new ActionRowBuilder().addComponents(itemField), new ActionRowBuilder().addComponents(payField));
        } else {
            const issueField = new TextInputBuilder().setCustomId('issue_field').setLabel('يرجى وصف مشكلتك بالتفصيل').setStyle(TextInputStyle.Paragraph).setRequired(true);
            ticketModal.addComponents(new ActionRowBuilder().addComponents(issueField));
        }
        await interaction.showModal(ticketModal);
    }

    // --- إنشاء قناة التذكرة بعد تعبئة المودال ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.replace('modal_', '');
        const isBuy = type === 'buy_option';

        const ticketChannel = await interaction.guild.channels.create({
            name: `${isBuy ? 'طلب' : 'دعم'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const staffEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle(`تذكرة جديدة - قسم ${isBuy ? 'المبيعات' : 'الدعم'}`)
            .setDescription(isBuy ? 
                `**المنتج المطلوب:** ${interaction.fields.getTextInputValue('item_field')}\n**طريقة الدفع:** ${interaction.fields.getTextInputValue('pay_field')}` : 
                `**وصف المشكلة:** ${interaction.fields.getTextInputValue('issue_field')}`)
            .setFooter({ text: `تذكرة العميل: ${interaction.user.tag}` });

        const staffButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير الاسم').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_btn').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [staffEmbed], components: [staffButtons] });
        await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح، يمكنك التوجه إليها هنا: ${ticketChannel}` });
    }
});


client.login(process.env.TOKEN);

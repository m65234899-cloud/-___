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

// --- [ الإعدادات الثابتة ] ---
const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const BUY_CATEGORY_ID = '1478604299549544601'; 
const SUPPORT_CATEGORY_ID = '1477992348033093683'; 
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

let orderCounter = 1;
const invoices = new Map();

function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    return parseInt(str);
}

client.once('ready', () => {
    console.log(`✅ البوت شغال بكامل تفاصيله المطلوبة.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- أمر الضريبة ---
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

    // --- أمر عرض الفاتورة (مضاف إليه الاسم والآيدي) ---
    if (message.content.startsWith('!فاتورة')) {
        const args = message.content.split(/ +/);
        const invNum = args[1];
        if (!invNum) return message.reply("⚠️ يرجى كتابة رقم الفاتورة.");
        
        const data = invoices.get(invNum);
        if (!data) return message.reply("❌ لم يتم العثور على الفاتورة.");

        const invEmbed = new EmbedBuilder()
            .setTitle(`تفاصيل فاتورة الشراء #${invNum}`)
            .setColor(0x2ecc71)
            .addFields(
                { name: '👤 اسم العميل:', value: `${data.userName}`, inline: true },
                { name: '🆔 آيدي العميل:', value: `\`${data.userId}\``, inline: true },
                { name: '📦 المنتج:', value: `${data.itemName}`, inline: false },
                { name: '📅 التاريخ:', value: `${data.date}`, inline: false }
            )
            .setFooter({ text: 'Twins Store' })
            .setTimestamp();

        await message.channel.send({ embeds: [invEmbed] });
    }

    // --- أمر إنشاء التكت الرئيسي ---
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const ticketEmbed = new EmbedBuilder()
            .setTitle('مركز المساعدة والطلبات')
            .setDescription('مرحباً بك في المركز الخاص بنا، يرجى اختيار القسم المناسب لمشكلتك أو طلبك من القائمة المنسدلة في الأسفل.')
            .setColor(0x808080)
            .setImage(MAIN_IMAGE)
            .setFooter({ text: 'Twins Store' });

        const selectionMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إختر نوع التذكرة التي ترغب بفتحها')
                .addOptions([
                    { label: 'قسم المبيعات والشراء', description: 'لطلب شراء الأغراض أو المنتجات الخاصة بنا', value: 'buy_option' },
                    { label: 'قسم الدعم الفني', description: 'إذا واجهت مشكلة تقنية أو لديك استفسار عام', value: 'support_option' },
                    { label: 'تحديث القائمة', description: 'تنشيط وتحديث خيارات القائمة المنسدلة', value: 'refresh' }
                ])
        );
        await message.channel.send({ embeds: [ticketEmbed], components: [selectionMenu] });
    }

    // --- أمر الشراء !y ---
    if (message.content.startsWith('!y')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const targetID = message.content.split(/ +/)[1];
        await message.delete().catch(() => null);
        if (!targetID) return;
        
        const targetUser = await client.users.fetch(targetID).catch(() => null);
        if (!targetUser) return;

        const purchaseEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('تأكيد عملية الشراء')
            .setDescription(`عزيزي العميل ${targetUser}، يرجى الضغط على الزر أدناه لتأكيد عملية الشراء الخاصة بك.`);

        const actionButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`y_confirm_${targetID}`).setLabel('تأكيد وإتمام الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`y_cancel_${targetID}`).setLabel('إلغاء العملية').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [purchaseEmbed], components: [actionButtons] });
    }
});

client.on('interactionCreate', async (interaction) => {
    
    // أزرار !y
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('y_confirm_')) {
            const targetId = interaction.customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ للعميل فقط.", ephemeral: true });
            
            const modal = new ModalBuilder().setCustomId(`y_modal_${targetId}`).setTitle('بيانات الفاتورة');
            const input = new TextInputBuilder().setCustomId('y_item').setLabel('ماذا اشتريت؟').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        if (interaction.customId.startsWith('y_cancel_')) {
            const targetId = interaction.customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ للعميل فقط.", ephemeral: true });
            await interaction.update({ content: `❌ تم إلغاء الطلب.`, embeds: [], components: [] });
        }
    }

    // قائمة التكت
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم التحديث.', ephemeral: true });

        const modal = new ModalBuilder().setCustomId(`t_modal_${choice}`).setTitle('بيانات التذكرة');
        if (choice === 'buy_option') {
            const q1 = new TextInputBuilder().setCustomId('q1').setLabel('ما هو طلبك؟').setStyle(TextInputStyle.Short).setRequired(true);
            const q2 = new TextInputBuilder().setCustomId('q2').setLabel('طريقة الدفع؟').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(q1), new ActionRowBuilder().addComponents(q2));
        } else {
            const q3 = new TextInputBuilder().setCustomId('q3').setLabel('وصف المشكلة').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(q3));
        }
        await interaction.showModal(modal);
    }

    // معالجة المودالات (الفاتورة والاسم والآيدي)
    if (interaction.isModalSubmit()) {
        
        // نظام !y مع (الاسم والآيدي) في كل مكان
        if (interaction.customId.startsWith('y_modal_')) {
            const item = interaction.fields.getTextInputValue('y_item');
            const invId = orderCounter++;
            const dateStr = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Riyadh' });
            
            // حفظ البيانات
            invoices.set(invId.toString(), { 
                userId: interaction.user.id, 
                userName: interaction.user.username, 
                itemName: item, 
                date: dateStr 
            });

            const successEmbed = new EmbedBuilder()
                .setTitle('تمت عملية الشراء بنجاح ✅')
                .setColor(0x2ecc71)
                .addFields(
                    { name: '👤 اسم العميل:', value: interaction.user.username, inline: true },
                    { name: '🆔 آيدي العميل:', value: `\`${interaction.user.id}\``, inline: true },
                    { name: '📦 المنتج المشتراة:', value: item, inline: false },
                    { name: '🔢 رقم الفاتورة:', value: `#${invId}`, inline: true }
                )
                .setTimestamp();

            await interaction.update({ content: `✅ تم إتمام العملية بنجاح!`, embeds: [successEmbed], components: [] });

            // إرسال للخاص (الاسم والآيدي)
            try {
                await interaction.user.send({ 
                    content: `شكراً لشرائك من **VAULTA Store**! إليك تفاصيل فاتورتك:`, 
                    embeds: [successEmbed] 
                });
            } catch (e) { console.log("الخاص مقفل"); }

            // سجل اللوج (الاسم والآيدي)
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('سجل مبيعات جديد 💰')
                    .setColor(0x2ecc71)
                    .addFields(
                        { name: 'العميل:', value: `${interaction.user.tag}`, inline: true },
                        { name: 'الآيدي:', value: `\`${interaction.user.id}\``, inline: true },
                        { name: 'المنتج:', value: item, inline: false },
                        { name: 'رقم الفاتورة:', value: `#${invId}`, inline: true }
                    )
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        }

        // مودال إنشاء التكت (التنسيق النصي داخل الـ Embed)
        if (interaction.customId.startsWith('t_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            const isBuy = interaction.customId.includes('buy_option');
            const channel = await interaction.guild.channels.create({
                name: `${isBuy ? 'طلب' : 'دعم'}-${interaction.user.username}-${interaction.user.id}`,
                parent: isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            const val1 = isBuy ? interaction.fields.getTextInputValue('q1') : interaction.fields.getTextInputValue('q3');
            const val2 = isBuy ? interaction.fields.getTextInputValue('q2') : null;

            const ticketEmbed = new EmbedBuilder()
                .setTitle('Twins Store Support Ticket')
                .setColor(0x2f3136)
                .setDescription(`يرجى انتظار الدعم الفني لتلقي استفسارك\n\n**${isBuy ? 'ما هو طلبك؟' : 'وصف المشكلة:'}**\n${val1}\n\n${isBuy ? `**طريقة دفعك**\n${val2}` : ''}`)
                .setFooter({ text: `تذكرة العميل: ${interaction.user.tag}` });

            const r1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير الاسم').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('delete_btn').setLabel('إغلاق').setStyle(ButtonStyle.Danger)
            );
            const r2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('remind_btn').setLabel('تذكير العضو (خاص)').setStyle(ButtonStyle.Secondary)
            );

            await channel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [r1, r2] });
            await interaction.editReply(`✅ تم فتح التذكرة: ${channel}`);
        }

        // مودال تغيير الاسم
        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('name_input');
            await interaction.channel.setName(newName);
            await interaction.reply({ content: `✅ تم التغيير إلى: ${newName}`, ephemeral: true });
        }
    }

    // أزرار التحكم
    if (interaction.isButton()) {
        const { customId, channel, user, member } = interaction;
        if (['claim_btn', 'delete_btn', 'rename_btn', 'remind_btn'].includes(customId)) {
            if (!member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: "❌ للإدارة فقط.", ephemeral: true });

            if (customId === 'claim_btn') {
                await channel.send({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setDescription(`🔒 استلمت بواسطة: ${user}`)] });
                await interaction.deferUpdate();
            }
            if (customId === 'remind_btn') {
                const customerId = channel.name.split('-').pop();
                const customer = await client.users.fetch(customerId).catch(() => null);
                if (customer) {
                    try { 
                        await customer.send(`🔔 يرجى الرد على تذكرتك: ${channel}`); 
                        await channel.send(`✅ تم التنبيه خاص.`); 
                    } catch { 
                        await channel.send(`❌ الخاص مقفل، رد هنا <@${customerId}>`); 
                    }
                }
                await interaction.deferUpdate();
            }
            if (customId === 'rename_btn') {
                const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير الاسم');
                const input = new TextInputBuilder().setCustomId('name_input').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
            if (customId === 'delete_btn') {
                await interaction.reply("⚠️ جاري الحذف...");
                setTimeout(() => channel.delete(), 2000);
            }
        }
    }
});

client.login(TOKEN);

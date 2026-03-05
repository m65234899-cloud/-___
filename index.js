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

// --- [ دالة حساب الضريبة ] ---
function parseAmount(amountStr) {
    const str = amountStr.toLowerCase();
    const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
    const lastChar = str[str.length - 1];
    if (multipliers[lastChar]) return parseInt(parseFloat(str.slice(0, -1)) * multipliers[lastChar]);
    return parseInt(str);
}

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} جاهز للعمل بكامل طاقته!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // أمر الضريبة
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

    // أمر إنشاء التكت
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

    // أمر الشراء !y
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
            .setDescription(`عزيزي العميل ${targetUser}، يرجى الضغط على الزر أدناه لتأكيد عملية الشراء.`);

        const actionButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`y_confirm_${targetID}`).setLabel('تأكيد وإتمام الشراء').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`y_cancel_${targetID}`).setLabel('إلغاء العملية').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ content: `${targetUser}`, embeds: [purchaseEmbed], components: [actionButtons] });
    }
});

client.on('interactionCreate', async (interaction) => {
    
    // --- [ التعامل مع أزرار !y ] ---
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('y_confirm_')) {
            const targetId = interaction.customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر ليس لك.", ephemeral: true });
            
            const modal = new ModalBuilder().setCustomId(`y_modal_${targetId}`).setTitle('إتمام الفاتورة');
            const input = new TextInputBuilder().setCustomId('y_item').setLabel('ماذا اشتريت؟').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        if (interaction.customId.startsWith('y_cancel_')) {
            const targetId = interaction.customId.split('_')[2];
            if (interaction.user.id !== targetId) return interaction.reply({ content: "❌ هذا الزر ليس لك.", ephemeral: true });
            await interaction.update({ content: `❌ تم إلغاء الطلب بواسطة العميل.`, embeds: [], components: [] });
        }
    }

    // --- [ القائمة المنسدلة للتكت ] ---
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

    // --- [ التعامل مع المودالات (Modals) ] ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('y_modal_')) {
            const item = interaction.fields.getTextInputValue('y_item');
            const invId = orderCounter++;
            invoices.set(invId.toString(), { userName: interaction.user.username, itemName: item, date: new Date().toLocaleString() });
            await interaction.update({ content: `✅ تم الشراء! فاتورتك هي: **#${invId}**`, embeds: [], components: [] });
        }

        if (interaction.customId.startsWith('t_modal_')) {
            await interaction.deferReply({ ephemeral: true });
            const isBuy = interaction.customId.includes('buy_option');
            const channel = await interaction.guild.channels.create({
                name: `${isBuy ? 'طلب' : 'دعم'}-${interaction.user.username}-${interaction.user.id}`, // أضفت الآيدي هنا عشان نقدر نسحبه في التذكير
                parent: isBuy ? BUY_CATEGORY_ID : SUPPORT_CATEGORY_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            const val1 = isBuy ? interaction.fields.getTextInputValue('q1') : interaction.fields.getTextInputValue('q3');
            const val2 = isBuy ? interaction.fields.getTextInputValue('q2') : null;

            const embed = new EmbedBuilder()
                .setTitle('Twins Store Support Ticket')
                .setColor(0x2f3136)
                .setDescription(`**ما هو طلبك؟**\n${val1}\n\n${isBuy ? `**طريقة دفعك**\n${val2}` : ''}`);

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير الاسم').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('delete_btn').setLabel('إغلاق').setStyle(ButtonStyle.Danger)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('remind_btn').setLabel('تذكير العضو').setStyle(ButtonStyle.Secondary)
            );

            await channel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [embed], components: [row1, row2] });
            await interaction.editReply(`✅ تم فتح التذكرة: ${channel}`);
        }

        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('name_input');
            await interaction.channel.setName(newName);
            await interaction.reply({ content: `✅ تم تغيير اسم القناة إلى: ${newName}`, ephemeral: true });
        }
    }

    // --- [ أزرار التحكم داخل التكت ] ---
    if (interaction.isButton()) {
        const { customId, channel, user, member } = interaction;
        if (['claim_btn', 'delete_btn', 'rename_btn', 'remind_btn'].includes(customId)) {
            if (!member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: "❌ للإدارة فقط.", ephemeral: true });

            if (customId === 'claim_btn') {
                await channel.send({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setDescription(`🔒 استلمت بواسطة: ${user}`)] });
                await interaction.deferUpdate();
            }
            if (customId === 'remind_btn') {
                // استخراج آيدي العميل من اسم القناة
                const customerId = channel.name.split('-').pop();
                const customer = await client.users.fetch(customerId).catch(() => null);
                
                if (customer) {
                    try {
                        await customer.send(`🔔 مرحباً بك، يرجى الرد على تذكرتك في سيرفرنا لإكمال الإجراءات: ${channel}`);
                        await channel.send({ embeds: [new EmbedBuilder().setColor(0x3498db).setDescription(`✅ تم إرسال تذكير للعضو في **الخاص** بنجاح.`)] });
                    } catch (e) {
                        await channel.send({ content: `❌ لم أتمكن من إرسال رسالة خاصة للعضو (ربما قام بقفل الخاص)، سأقوم بمنشنته هنا: <@${customerId}>` });
                    }
                }
                await interaction.deferUpdate();
            }
            if (customId === 'rename_btn') {
                const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير اسم التذكرة');
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

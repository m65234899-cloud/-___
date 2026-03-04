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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = 'ضع_توكن_بوتك_هنا';
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const IMAGE_URL = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a714e6&is=69a5c366&hm=ba5bf3ff6018016346700b141f7b0527218b7ad9828e5ccd874198942f69b85a&';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// أمر إنشاء قائمة التذاكر
client.on('messageCreate', async (message) => {
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const embed = new EmbedBuilder()
            .setTitle('قائمة التذاكر')
            .setDescription('اختر من الخيارات الموجودة أدناه حسب المشكلة أو الطلب')
            .setColor(0x808080) // لون رمادي
            .setImage(IMAGE_URL);

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    {
                        label: 'شراء غرض',
                        description: 'للشراء افتح تذكرة من هنا',
                        value: 'buy_order',
                    },
                    {
                        label: 'الدعم الفني',
                        description: 'لديك مشكلة أو استفسار هنا',
                        value: 'support',
                    },
                    {
                        label: 'تحديث القائمة',
                        description: 'لتحديث قائمة الخيارات من هنا',
                        value: 'refresh_menu',
                    },
                ])
        );

        await message.channel.send({ embeds: [embed], components: [menu] });
    }
});

// التفاعل مع القائمة والأزرار
client.on('interactionCreate', async (interaction) => {
    
    // 1. التعامل مع السيلكت منيو (فتح التذكرة)
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];

        if (choice === 'refresh_menu') {
            return interaction.reply({ content: 'تم تحديث القائمة بنجاح.', ephemeral: true });
        }

        // إنشاء المودال (النموذج الكتابي)
        const modal = new ModalBuilder()
            .setCustomId(`modal_${choice}`)
            .setTitle(choice === 'buy_order' ? 'تفاصيل الطلب' : 'شرح المشكلة');

        const input = new TextInputBuilder()
            .setCustomId('user_text')
            .setLabel(choice === 'buy_order' ? 'اكتب الطلب وطريقة الدفع والتفاصيل' : 'اشرح مشكلتك هنا')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }

    // 2. استقبال بيانات المودال وإنشاء الروم
    if (interaction.isModalSubmit()) {
        const type = interaction.customId.split('_')[1]; // buy or support
        const userText = interaction.fields.getTextInputValue('user_text');
        const channelName = `${type === 'buy' ? 'order' : 'support'}-${interaction.user.username}`;

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const ticketEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setImage(IMAGE_URL)
            .setDescription(`**صاحب التذكرة:** <@${interaction.user.id}>\n**${type === 'buy' ? 'الطلب والتفاصيل' : 'المشكلة'}:**\n${userText}`);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_ticket').setLabel('تغيير اسم التذكرة').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('حذف التذكرة').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${interaction.user.id}> | الإدارة <@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [buttons] });
        await interaction.reply({ content: `تم فتح تذكرتك هنا: ${channel}`, ephemeral: true });
    }

    // 3. أزرار التحكم (داخل التذكرة)
    if (interaction.isButton()) {
        // التحقق من رتبة الإدارة
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({ content: 'عذراً، هذا الأمر مخصص للإدارة فقط.', ephemeral: true });
        }

        if (interaction.customId === 'claim_ticket') {
            await interaction.channel.send({ content: `تم استلام التذكرة بواسطة: <@${interaction.user.id}>` });
            await interaction.reply({ content: 'لقد استلمت التذكرة بنجاح.', ephemeral: true });
        }

        if (interaction.customId === 'rename_ticket') {
            // هنا مجرد مثال لتغيير الاسم لاسم ثابت، يمكن تطويرها بمودال آخر
            await interaction.channel.setName(`handled-${interaction.user.username}`);
            await interaction.reply({ content: 'تم تغيير اسم الروم.', ephemeral: true });
        }

        if (interaction.customId === 'delete_ticket') {
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send(`تم حذف تذكرة ${interaction.channel.name}. تم الحذف بواسطة: ${interaction.user.tag}`);
            }
            await interaction.reply({ content: 'سيتم حذف التذكرة خلال ثوانٍ...' });
            setTimeout(() => interaction.channel.delete(), 3000);
        }
    }
});

client.login(TOKEN);

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

const TOKEN = process.env.TOKEN; 
const ADMIN_ROLE_ID = '1472225010134421676';
const LOG_CHANNEL_ID = '1473378884857630821';
const MAIN_IMAGE = 'https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png';

client.once('ready', () => console.log(`✅ ${client.user.tag} متصل وجاهز!`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- أمر !تكت ---
    if (message.content === '!تكت') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const mainEmbed = new EmbedBuilder()
            .setTitle('قائمة التذاكر').setDescription('اختر من الخيارات الموجودة أدناه').setColor(0x808080).setImage(MAIN_IMAGE);
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('ticket_select').setPlaceholder('إضغط هنا لفتح تذكرة')
                .addOptions([
                    { label: 'شراء غرض', description: 'للشراء افتح تذكرة من هنا', value: 'buy_option' },
                    { label: 'الدعم الفني', description: 'لديك مشكلة أو استفسار هنا', value: 'support_option' },
                    { label: 'تحديث القائمة', description: 'لتحديث قائمة الخيارات من هنا', value: 'refresh' }
                ])
        );
        await message.channel.send({ embeds: [mainEmbed], components: [menu] });
    }

    // --- أمر !رسالة (روم أو رتبة خاص بـ منشن) ---
    if (message.content.startsWith('!رسالة')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const args = message.content.slice('!رسالة'.length).trim().split(/ +/);
        const targetID = args.shift();
        const text = args.join(' ');
        if (!targetID || !text) return message.reply('⚠️ الاستخدام: `!رسالة [ID] [النص]`');

        const targetChannel = client.channels.cache.get(targetID);
        if (targetChannel) {
            await targetChannel.send(text);
            return message.reply(`✅ أرسلت للروم: ${targetChannel.name}`);
        }

        const targetRole = message.guild.roles.cache.get(targetID);
        if (targetRole) {
            const members = targetRole.members;
            let count = 0;
            message.reply(`⏳ جاري الإرسال إلى ${members.size} عضو في الخاص مع المنشن...`);
            for (const [id, member] of members) {
                try {
                    await member.send(`${member} \n\n${text}`); // هنا المنشن في الخاص
                    count++;
                } catch (e) { console.log(`تعذر الإرسال لـ: ${member.user.tag}`); }
            }
            return message.channel.send(`✅ تم الإرسال بنجاح إلى (${count}) عضو مع المنشن في الخاص.`);
        }
        return message.reply('❌ ID غير صحيح.');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const choice = interaction.values[0];
        if (choice === 'refresh') return interaction.reply({ content: '✅ تم التحديث.', ephemeral: true });

        const modal = new ModalBuilder().setCustomId(`modal_${choice}`).setTitle(choice === 'buy_option' ? 'طلب شراء' : 'دعم فني');

        if (choice === 'buy_option') {
            const item = new TextInputBuilder().setCustomId('item_field').setLabel('نوع الغرض').setStyle(TextInputStyle.Short).setRequired(true);
            const pay = new TextInputBuilder().setCustomId('pay_field').setLabel('طريقة التحويل').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(item), new ActionRowBuilder().addComponents(pay));
        } else {
            const issue = new TextInputBuilder().setCustomId('issue_field').setLabel('اشرح مشكلتك').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(issue));
        }
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'rename_modal') {
            const newName = interaction.fields.getTextInputValue('new_name_field');
            await interaction.channel.setName(newName);
            return interaction.reply({ content: `✅ تم تغيير الاسم إلى: **${newName}**` });
        }

        await interaction.deferReply({ ephemeral: true });
        const isBuy = interaction.customId === 'modal_buy_option';
        const channelName = `${isBuy ? 'order' : 'support'}-${interaction.user.username}`;
        
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        const ticketEmbed = new EmbedBuilder().setColor(0x808080);
        if (isBuy) {
            ticketEmbed.setTitle('🛒 طلب شراء جديد').addFields(
                { name: 'نوع الغرض:', value: interaction.fields.getTextInputValue('item_field'), inline: true },
                { name: 'طريقة التحويل:', value: interaction.fields.getTextInputValue('pay_field'), inline: true }
            );
        } else {
            ticketEmbed.setTitle('🛠️ دعم فني').addFields({ name: 'المشكلة:', value: interaction.fields.getTextInputValue('issue_field') });
        }

        const btns = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_btn').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rename_btn').setLabel('تغيير اسم التذكرة').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_btn').setLabel('حذف التذكرة').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${interaction.user.id}> | <@&${ADMIN_ROLE_ID}>`, embeds: [ticketEmbed], components: [btns] });
        await interaction.editReply(`✅ تذكرتك: ${channel}`);
    }

    if (interaction.isButton()) {
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) return interaction.reply({ content: 'للإدارة فقط!', ephemeral: true });

        if (interaction.customId === 'claim_btn') {
            await interaction.channel.send(`🔒 استلم التذكرة: <@${interaction.user.id}>`);
            await interaction.reply({ content: 'تم الاستلام.', ephemeral: true });
        }
        if (interaction.customId === 'rename_btn') {
            const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('تغيير الاسم');
            const input = new TextInputBuilder().setCustomId('new_name_field').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'delete_btn') {
            const log = client.channels.cache.get(LOG_CHANNEL_ID);
            if (log) log.send(`🗑️ حُذفت تذكرة \`${interaction.channel.name}\` بواسطة ${interaction.user.tag}`);
            await interaction.reply('جاري الحذف...');
            setTimeout(() => interaction.channel.delete(), 2000);
        }
    }
});


// استدعاء التوكن من السكرت (Secrets)
client.login(process.env.TOKEN); 


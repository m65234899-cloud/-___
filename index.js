import discord
from discord.ext import commands
from discord import ui

# الإعدادات الأساسية
TOKEN = 'YOUR_BOT_TOKEN'
ADMIN_ROLE_ID = 1472225010134421676  # رتبة الإدارة
LOG_CHANNEL_ID = 1473378884857630821 # روم السجلات
GUILD_ID = 1466503559364350158 # ضع ID السيرفر هنا

class TicketBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.all()
        super().__init__(command_prefix='!', intents=intents)

    async def setup_hook(self):
        self.add_view(TicketLauncher())

# --- النوافذ المنبثقة (Modals) ---

class PurchaseModal(ui.Modal, title='الطلبات'):
    order = ui.TextInput(label='ما هو طلبك؟', style=discord.TextStyle.paragraph, placeholder='اكتب طلبك هنا...', required=True)
    payment = ui.TextInput(label='طريقة دفعك (Stc - اخرى - برق)', placeholder='مثلاً: Stc Pay', required=True)

    async def on_submit(self, interaction: discord.Interaction):
        await create_ticket_channel(interaction, "order", self.order.value, self.payment.value)

class SupportModal(ui.Modal, title='الدعم الفني'):
    issue = ui.TextInput(label='اشرح مشكلتك', style=discord.TextStyle.paragraph, placeholder='اكتب تفاصيل المشكلة هنا...', required=True)

    async def on_submit(self, interaction: discord.Interaction):
        await create_ticket_channel(interaction, "support", self.issue.value)

# --- أزرار التحكم داخل التذكرة ---

class TicketControls(ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @ui.button(label="استلام التذكرة", style=discord.ButtonStyle.green, custom_id="claim_ticket")
    async def claim(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user.get_role(ADMIN_ROLE_ID):
            await interaction.response.send_message(吸引f"تم استلام التذكرة من قبل {interaction.user.mention}", ephemeral=False)
            button.disabled = True
            await interaction.message.edit(view=self)
        else:
            await interaction.response.send_message("هذا الزر مخصص للإدارة فقط!", ephemeral=True)

    @ui.button(label="تغيير اسم التذكرة", style=discord.ButtonStyle.blurple, custom_id="rename_ticket")
    async def rename(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user.get_role(ADMIN_ROLE_ID):
            # هنا يمكنك إضافة Modal لتغيير الاسم، للتبسيط سنضيف كلمة 'fixed'
            await interaction.channel.edit(name=f"fixed-{interaction.channel.name}")
            await interaction.response.send_message("تم تغيير اسم الروم.", ephemeral=True)
        else:
            await interaction.response.send_message("للإدارة فقط!", ephemeral=True)

    @ui.button(label="حذف التذكرة", style=discord.ButtonStyle.red, custom_id="delete_ticket")
    async def delete(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user.get_role(ADMIN_ROLE_ID):
            log_channel = interaction.guild.get_channel(LOG_CHANNEL_ID)
            # إرسال سجل قبل الحذف
            await log_channel.send(f"تذكرة {interaction.channel.name} تم حذفها بواسطة {interaction.user.mention}")
            await interaction.response.send_message("سيتم حذف التذكرة خلال ثوانٍ...")
            await interaction.channel.delete()
        else:
            await interaction.response.send_message("للإدارة فقط!", ephemeral=True)

# --- قائمة الاختيار الرئيسية (Select Menu) ---

class TicketLauncher(ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @ui.select(
        placeholder="اضغط هنا لفتح تذكرة",
        options=[
            discord.SelectOption(label="شراء غرض", description="للشراء افتح تذكرة من هنا", emoji="🛒", value="buy"),
            discord.SelectOption(label="الدعم الفني", description="لديك مشكلة أو استفسار هنا", emoji="🛠️", value="support"),
            discord.SelectOption(label="تحديث القائمة", description="لتحديث قائمة الخيارات من هنا", emoji="🔄", value="refresh")
        ]
    )
    async def select_callback(self, interaction: discord.Interaction, select: ui.Select):
        if select.values[0] == "buy":
            await interaction.response.send_modal(PurchaseModal())
        elif select.values[0] == "support":
            await interaction.response.send_modal(SupportModal())
        elif select.values[0] == "refresh":
            await interaction.response.edit_message(view=self)

# --- وظيفة إنشاء الروم ---

async def create_ticket_channel(interaction, type, info1, info2=None):
    guild = interaction.guild
    admin_role = guild.get_role(ADMIN_ROLE_ID)
    
    overwrites = {
        guild.default_role: discord.PermissionOverwrite(read_messages=False),
        interaction.user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
        admin_role: discord.PermissionOverwrite(read_messages=True, send_messages=True)
    }

    channel_name = f"{type}-{interaction.user.name}"
    channel = await guild.create_text_channel(name=channel_name, overwrites=overwrites)
    
    await interaction.response.send_message(f"تم فتح التذكرة: {channel.mention}", ephemeral=True)

    embed = discord.Embed(title="معلومات التذكرة الجديدة", color=discord.Color.light_gray())
    embed.add_field(name="صاحب الطلب", value=interaction.user.mention, inline=False)
    
    if type == "order":
        embed.add_field(name="الطلب", value=info1, inline=False)
        embed.add_field(name="طريقة الدفع", value=info2, inline=False)
    else:
        embed.add_field(name="المشكلة", value=info1, inline=False)

    await channel.send(content=f"{interaction.user.mention} | الإدارة <@&{ADMIN_ROLE_ID}>", embed=embed, view=TicketControls())

# --- أمر التشغيل ---

bot = TicketBot()

@bot.command(name="تكت")
async def ticket(ctx):
    embed = discord.Embed(
        title="الطلبات",
        description="اختر من الخيارات الموجودة بالأسفل حسب المشكلة أو الطلب",
        color=discord.Color.light_gray()
    )
    # رابط الصورة الذي زودتني به
    embed.set_image(url="https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png")
    
    await ctx.send(embed=embed, view=TicketLauncher())

bot.run(TOKEN)

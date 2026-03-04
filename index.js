import discord
from discord.ext import commands
from discord.ui import Button, View, Modal, InputText
from discord import app_commands

# تهيئة البوت
intents = discord.Intents.default()
bot = commands.Bot(command_prefix='!', intents=intents)

# معرف الفاوندر أو الأشخاص ذوي الصلاحية الخاصة
SPECIAL_ROLE_ID = '1472225010134421676'

# إنشاء نموذج الطلبات
class RequestModal(Modal):
    def __init__(self):
        super().__init__(title="طلب تذكرة")

        # إضافة الحقول
        self.add_item(InputText(label="ما هو طلبك؟", placeholder="اكتب طلبك هنا", required=True))
        self.add_item(InputText(label="طريقة دفعك (STC, بطاقة, إلخ)", placeholder="أدخل طريقة الدفع", required=True))

    async def on_submit(self, interaction: discord.Interaction):
        # الحصول على القيم المدخلة
        الطلب = self.children[0].value
        الدفع = self.children[1].value
        
        # إرسال تفاصيل التذكرة
        await interaction.response.send_message(f"تم تقديم التذكرة بنجاح! \nطلبك: {الطلب} \nطريقة الدفع: {الدفع}")

# إنشاء نموذج الدعم الفني
class SupportModal(Modal):
    def __init__(self):
        super().__init__(title="الدعم الفني")

        # إضافة الحقول
        self.add_item(InputText(label="أشرح مشكلتك", placeholder="اكتب مشكلتك هنا", required=True))

    async def on_submit(self, interaction: discord.Interaction):
        # الحصول على التفاصيل المدخلة
        المشكلة = self.children[0].value
        
        # إرسال تفاصيل الدعم الفني
        await interaction.response.send_message(f"تم تقديم تذكرة الدعم الفني بنجاح! \nالمشكلة: {المشكلة}")

# أزرار التفاعل مع التذكرة
class TicketButtons(View):
    def __init__(self, user_id):
        super().__init__(timeout=None)
        self.user_id = user_id

    @discord.ui.button(label="إعادة تسمية التذكرة", style=discord.ButtonStyle.primary)
    async def rename_ticket(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id == int(self.user_id) or any(role.id == int(SPECIAL_ROLE_ID) for role in interaction.user.roles):
            await interaction.response.send_message(f"تم إعادة تسمية التذكرة بواسطة {interaction.user.mention}")
        else:
            await interaction.response.send_message("ليس لديك صلاحية لإعادة تسمية التذكرة.")

    @discord.ui.button(label="حذف التذكرة", style=discord.ButtonStyle.danger)
    async def delete_ticket(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id == int(self.user_id) or any(role.id == int(SPECIAL_ROLE_ID) for role in interaction.user.roles):
            await interaction.response.send_message(f"تم حذف التذكرة بواسطة {interaction.user.mention}")
        else:
            await interaction.response.send_message("ليس لديك صلاحية لحذف التذكرة.")
    
    @discord.ui.button(label="تذكير العضو", style=discord.ButtonStyle.secondary)
    async def remind_member(self, button: discord.ui.Button, interaction: discord.Interaction):
        if interaction.user.id == int(self.user_id) or any(role.id == int(SPECIAL_ROLE_ID) for role in interaction.user.roles):
            await interaction.response.send_message(f"تم تذكير العضو بواسطة {interaction.user.mention}")
        else:
            await interaction.response.send_message("ليس لديك صلاحية لتذكير العضو.")

# أمر التكت
@bot.command()
async def تكت(ctx):
    # الرابط الخاص بالصورة
    image_url = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a86666&is=69a714e6&hm=e900857714393761698f8d1fba5ef59b7bb3c1889b0035f6932f5b18a0fd3213&"
    
    # إنشاء الأزرار
    button1 = Button(label="الطلبات", style=discord.ButtonStyle.primary)
    button1.callback = lambda interaction: interaction.response.send_modal(RequestModal())

    button2 = Button(label="الدعم الفني", style=discord.ButtonStyle.secondary)
    button2.callback = lambda interaction: interaction.response.send_modal(SupportModal())

    # إضافة الأزرار إلى الواجهة
    view = View()
    view.add_item(button1)
    view.add_item(button2)
    
    # إرسال الرسالة مع الصورة والأزرار
    embed = discord.Embed(title="نظام التذاكر", description="اختار الخدمة المطلوبة من القائمة أدناه")
    embed.set_image(url=image_url)
    await ctx.send(embed=embed, view=view)

# تشغيل البوت
bot.run('TOKEN')

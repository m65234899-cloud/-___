import discord
from discord.ext import commands
from discord import ui
import asyncio
import os
from dotenv import load_dotenv

# تحميل التوكن من البيئة
load_dotenv()  # تحميل المتغيرات من ملف .env
TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix='!', intents=intents)

ADMIN_ROLE_ID = 1472225010134421676 
BANNER_URL = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png"

# --- أزرار التحكم الرمادية داخل التذكرة ---
class TicketControls(ui.View):
    def __init__(self, member: discord.Member):
        super().__init__(timeout=None)
        self.member = member

    @ui.button(label="استلام التذكرة", style=discord.ButtonStyle.secondary, custom_id="claim")
    async def claim(self, interaction: discord.Interaction, button: ui.Button):
        if not interaction.user.get_role(ADMIN_ROLE_ID):
            return await interaction.response.send_message("❌ الرتبة المطلوبة غير متوفرة لديك.", ephemeral=True)
        button.disabled = True
        button.label = "تم الاستلام"
        await interaction.response.edit_message(view=self)
        await interaction.followup.send(embed=discord.Embed(description=f"✅ تم استلام التذكرة بواسطة {interaction.user.mention}", color=0x2f3136))

    @ui.button(label="استدعاء العضو (خاص)", style=discord.ButtonStyle.secondary, custom_id="call")
    async def call(self, interaction: discord.Interaction, button: ui.Button):
        if not interaction.user.get_role(ADMIN_ROLE_ID):
            return await interaction.response.send_message("❌ الرتبة المطلوبة غير متوفرة لديك.", ephemeral=True)
        try:
            embed_dm = discord.Embed(title="🔔 تنبيه استدعاء", description=f"الإدارة بانتظارك في تذكرتك: {interaction.channel.mention}", color=0x2f3136)
            embed_dm.set_image(url=BANNER_URL)
            await self.member.send(embed=embed_dm)
            await interaction.response.send_message(f"✅ تم إرسال رسالة خاصة للعضو.", ephemeral=True)
        except:
            await interaction.response.send_message("❌ الخاص مغلق عند العضو.", ephemeral=True)

    @ui.button(label="حذف التذكرة", style=discord.ButtonStyle.secondary, custom_id="close")
    async def close(self, interaction: discord.Interaction, button: ui.Button):
        if not interaction.user.get_role(ADMIN_ROLE_ID):
            return await interaction.response.send_message("❌ الرتبة المطلوبة غير متوفرة لديك.", ephemeral=True)
        await interaction.response.send_message("⚠️ سيتم حذف التذكرة خلال 5 ثوانٍ...")
        await asyncio.sleep(5)
        await interaction.channel.delete()

# --- نافذة الدعم الفني ---
class SupportModal(ui.Modal, title='الدعم الفني'):
    problem = ui.TextInput(label='أشرح مشكلتك', style=discord.TextStyle.paragraph, placeholder='اكتب تفاصيل المشكلة هنا...', required=True)
    async def on_submit(self, interaction: discord.Interaction):
        channel = await interaction.guild.create_text_channel(name=f"ticket-{interaction.user.name}", overwrites={interaction.guild.default_role: discord.PermissionOverwrite(view_channel=False), interaction.user: discord.PermissionOverwrite(view_channel=True, send_messages=True), interaction.guild.get_role(ADMIN_ROLE_ID): discord.PermissionOverwrite(view_channel=True, send_messages=True)})
        embed = discord.Embed(title="𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐓𝐢𝐜𝐤𝐞𝐭", color=0x2f3136)
        embed.add_field(name="المشكلة :", value=f"\`\`\`{self.problem.value}\`\`\`")
        embed.set_image(url=BANNER_URL)
        await channel.send(content=f"{interaction.user.mention} <@&{ADMIN_ROLE_ID}>", embed=embed, view=TicketControls(interaction.user))
        await interaction.response.send_message(f"✅ تم فتح تذكرة دعم: {channel.mention}", ephemeral=True)

# --- نافذة الطلبات ---
class OrderModal(ui.Modal, title='فتح تذكرة طلبات'):
    order = ui.TextInput(label='ما هو طلبك ؟', required=True)
    payment = ui.TextInput(label='ماهي طريقة دفعك ؟', required=True)
    details = ui.TextInput(label='تفاصيل طلبك', style=discord.TextStyle.paragraph, required=True)
    async def on_submit(self, interaction: discord.Interaction):
        channel = await interaction.guild.create_text_channel(name=f"order-{interaction.user.name}", overwrites={interaction.guild.default_role: discord.PermissionOverwrite(view_channel=False), interaction.user: discord.PermissionOverwrite(view_channel=True, send_messages=True), interaction.guild.get_role(ADMIN_ROLE_ID): discord.PermissionOverwrite(view_channel=True, send_messages=True)})
        embed = discord.Embed(title="𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐓𝐢𝐜𝐤𝐞𝐭", color=0x2f3136)
        embed.add_field(name="الطلب :", value=f"\`\`\`{self.order.value}\`\`\`", inline=False)
        embed.add_field(name="الدفع :", value=f"\`\`\`{self.payment.value}\`\`\`", inline=False)
        embed.add_field(name="التفاصيل :", value=f"\`\`\`{self.details.value}\`\`\`", inline=False)
        embed.set_image(url=BANNER_URL)
        await channel.send(content=f"{interaction.user.mention} <@&{ADMIN_ROLE_ID}>", embed=embed, view=TicketControls(interaction.user))
        await interaction.response.send_message(f"✅ تذكرتك: {channel.mention}", ephemeral=True)

@bot.command(name="تكت")
async def ticket_cmd(ctx):
    embed = discord.Embed(title="اختار الخدمة التي ترغب بها", color=0x2f3136)
    embed.set_image(url=BANNER_URL)
    view = ui.View(timeout=None)
    select = ui.Select(placeholder="إختار خدمة", options=[discord.SelectOption(label="الطلبات", emoji="🛒"), discord.SelectOption(label="الدعم الفني", emoji="🛠️"), discord.SelectOption(label="إعادة تحميل", emoji="🔄")])
    async def callback(interaction):
        val = interaction.data['values'][0]
        if val == "الطلبات": await interaction.response.send_modal(OrderModal())
        elif val == "الدعم الفني": await interaction.response.send_modal(SupportModal())
        else: await interaction.response.send_message("🔄 تم التحديث", ephemeral=True)
    select.callback = callback
    view.add_item(select)
    await ctx.send(embed=embed, view=view)

# استخدام التوكن من البيئة
bot.run(os.getenv('TOKEN'))

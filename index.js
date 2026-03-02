import discord
from discord.ext import commands
from discord.ui import Button, View, Select
import asyncio

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# قاعدة بيانات وهمية للتذاكر
tickets = {}

# دالة لإنشاء التذكرة
async def create_ticket(ctx, ticket_type):
    ticket_id = len(tickets) + 1  # توليد معرف تذكرة فريد
    if ticket_type == "شراء":
        description = "يرجى تحديد طريقة الدفع وتفاصيل الطلب."
        choices = ["STC", "الاهلي", "برق", "الدفع عند الاستلام"]
        image_url = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a714e6&is=69a5c366&hm=ba5bf3ff6018016346700b141f7b0527218b7ad9828e5ccd874198942f69b85a&"
    elif ticket_type == "دعم فني":
        description = "يرجى شرح مشكلتك بالتفصيل."
        choices = ["مشكلة في الحساب", "مشكلة في التطبيق", "مشكلة فنية أخرى"]
        image_url = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a714e6&is=69a5c366&hm=ba5bf3ff6018016346700b141f7b0527218b7ad9828e5ccd874198942f69b85a&"
    elif ticket_type == "تحديث القائمة":
        description = "تحديث خيارات التذاكر."
        choices = ["إضافة خيارات", "حذف خيارات", "تعديل خيارات"]
        image_url = "https://cdn.discordapp.com/attachments/1473378884857630821/1477532261963403284/2C52B4D6-9301-46A4-8BC2-5D7127E89961.png?ex=69a714e6&is=69a5c366&hm=ba5bf3ff6018016346700b141f7b0527218b7ad9828e5ccd874198942f69b85a&"

    # إنشاء واجهة تذاكر تفاعلية
    select = Select(
        placeholder="اختر خيارًا...",
        options=[discord.SelectOption(label=choice) for choice in choices],
    )
    
    async def select_callback(interaction):
        selected_option = interaction.data['values'][0]
        ticket = tickets[ticket_id]
        ticket['selected_option'] = selected_option
        await interaction.response.send_message(f"تم اختيار: {selected_option} \nتفاصيل الطلب: {ticket}")
    
    select.callback = select_callback
    
    view = View()
    view.add_item(select)

    # حفظ التذكرة
    tickets[ticket_id] = {
        "user": ctx.author.name,
        "ticket_type": ticket_type,
        "description": description,
        "status": "مفتوحة",
        "selected_option": None,
        "image_url": image_url
    }

    # إرسال الرسالة مع واجهة الاختيارات
    await ctx.send(f"تم إنشاء تذكرة من نوع {ticket_type}.\n{description}\n{image_url}", view=view)

# الأمر لإنشاء تذكرة
@bot.command()
async def تكت(ctx):
    # إنشاء قائمة لاختيار نوع التذكرة
    select = Select(
        placeholder="اختر نوع التذكرة",
        options=[
            discord.SelectOption(label="شراء غرض"),
            discord.SelectOption(label="دعم فني"),
            discord.SelectOption(label="تحديث القائمة")
        ]
    )

    # دالة للتعامل مع الاختيارات
    async def select_callback(interaction):
        ticket_type = interaction.data['values'][0]
        await create_ticket(ctx, ticket_type)

    select.callback = select_callback

    # إرسال الرسالة
    view = View()
    view.add_item(select)
    await ctx.send("يرجى اختيار نوع التذكرة:", view=view)

# التفاعل مع الإدارة (حذف التذكرة، تغيير اسمها، أو استلامها)
@bot.command()
async def manage_ticket(ctx, ticket_action: str, ticket_id: int):
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("لا تملك الصلاحيات لتنفيذ هذا الأمر.")
        return

    if ticket_id not in tickets:
        await ctx.send("التذكرة غير موجودة.")
        return

    if ticket_action == "حذف":
        del tickets[ticket_id]
        await ctx.send(f"تم حذف التذكرة رقم {ticket_id}.")
    elif ticket_action == "تغيير اسم":
        new_name = "New Ticket Name"  # من الممكن أن تطلب من المسؤول إدخال اسم جديد
        tickets[ticket_id]["user"] = new_name
        await ctx.send(f"تم تغيير اسم التذكرة رقم {ticket_id} إلى {new_name}.")
    elif ticket_action == "استلام":
        tickets[ticket_id]["status"] = "مستلمة"
        await ctx.send(f"تم استلام التذكرة رقم {ticket_id}.")
    else:
        await ctx.send("الأمر غير صحيح، اختر بين (حذف، تغيير اسم، استلام).")

# بدء البوت
@bot.event
async def on_ready():
    print(f'تم تسجيل الدخول كـ {bot.user}')

# تشغيل البوت
bot.run('MTQ3MjIyODQ2MjMzNjAyMDU1Mg.GALbIe.vyrzfd47HIiy-7-EUDuBmxk0Xgyd_xmR9yK-KM')

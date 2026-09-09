from django.contrib import admin
from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "mobile", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "mobile", "message"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("اطلاعات کاربر", {"fields": ("name", "mobile")}),
        ("پیام", {"fields": ("message",)}),
        ("وضعیت", {"fields": ("status",)}),
        ("تاریخ‌ها", {"fields": ("created_at", "updated_at")}),
    )

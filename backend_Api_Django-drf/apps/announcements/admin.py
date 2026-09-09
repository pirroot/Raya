from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "is_pinned", "is_active", "date"]
    list_filter = ["is_pinned", "is_active"]
    search_fields = ["title", "content"]
    readonly_fields = ["date", "created_at", "updated_at"]
    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("title", "content")}),
        ("تنظیمات", {"fields": ("is_pinned", "is_active")}),
        ("تاریخ", {"fields": ("date",)}),
    )

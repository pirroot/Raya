from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "title_preview",
        "type",
        "priority",
        "is_read",
        "created_at",
        "time_ago_display",
    ]
    list_filter = ["type", "priority", "is_read", "created_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "title",
        "message",
    ]
    readonly_fields = ["id", "created_at", "updated_at", "sent_at", "read_at"]
    raw_id_fields = ["user"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "اطلاعات اصلی",
            {"fields": ("user", "type", "priority", "title", "message", "link")},
        ),
        ("وضعیت", {"fields": ("is_read", "read_at", "sent_at")}),
        ("اطلاعات تکمیلی", {"fields": ("metadata",)}),
        (
            "تاریخچه",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def title_preview(self, obj):
        return obj.title[:50] + "..." if len(obj.title) > 50 else obj.title

    title_preview.short_description = "عنوان"

    def time_ago_display(self, obj):
        from django.utils.timesince import timesince

        return timesince(obj.created_at)

    time_ago_display.short_description = "زمان"

    actions = ["mark_as_read", "mark_as_unread", "delete_old_notifications"]

    def mark_as_read(self, request, queryset):
        count = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"{count} اعلان به عنوان خوانده شده علامت‌گذاری شد.")

    mark_as_read.short_description = "✅ علامت‌گذاری به عنوان خوانده شده"

    def mark_as_unread(self, request, queryset):
        count = queryset.update(is_read=False, read_at=None)
        self.message_user(
            request, f"{count} اعلان به عنوان خوانده نشده علامت‌گذاری شد."
        )

    mark_as_unread.short_description = "❌ علامت‌گذاری به عنوان خوانده نشده"

    def delete_old_notifications(self, request, queryset):
        count, _ = queryset.delete()
        self.message_user(request, f"{count} اعلان حذف شد.")

    delete_old_notifications.short_description = "🗑️ حذف اعلان‌های انتخاب شده"

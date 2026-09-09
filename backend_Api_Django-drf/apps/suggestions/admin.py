from django.contrib import admin
from .models import Suggestion


@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "status", "likes", "created_at"]
    list_display_links = ["title", "user"]
    list_filter = ["status", "created_at"]
    search_fields = [
        "title",
        "content",
        "user__mobile",
        "user__first_name",
        "user__last_name",
    ]
    readonly_fields = ["likes", "created_at", "updated_at"]
    raw_id_fields = ["user", "liked_by"]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات پیشنهاد", {"fields": ("title", "content", "user")}),
        ("وضعیت و آمار", {"fields": ("status", "likes", "liked_by")}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

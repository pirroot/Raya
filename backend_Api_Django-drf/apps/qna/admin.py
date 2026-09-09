from django.contrib import admin
from .models import QA


@admin.register(QA)
class QAAdmin(admin.ModelAdmin):
    list_display = [
        "question",
        "author",
        "likes",
        "views",
        "order",
        "is_active",
        "created_at",
    ]
    list_display_links = ["question", "author"]
    list_filter = ["is_active", "created_at", "order"]
    search_fields = [
        "question",
        "answer",
        "author",
        "author__mobile",
        "author__first_name",
        "author__last_name",
    ]
    readonly_fields = ["likes", "views", "created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("سوال و پاسخ", {"fields": ("question", "answer", "author")}),
        ("تنظیمات نمایش", {"fields": ("order", "is_active")}),
        ("آمار", {"fields": ("likes", "views"), "classes": ("collapse",)}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

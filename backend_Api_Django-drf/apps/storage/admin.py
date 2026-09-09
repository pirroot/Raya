from django.contrib import admin
from .models import MediaFile


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "file_name",
        "file_type",
        "file_size",
        "uploaded_by",
        "created_at",
    ]
    list_display_links = ["id", "file_name"]
    list_filter = ["file_type", "created_at"]
    search_fields = [
        "file_name",
        "uploaded_by__mobile",
        "uploaded_by__first_name",
        "uploaded_by__last_name",
    ]
    readonly_fields = ["id", "created_at", "updated_at", "file_size"]
    ordering = ["-created_at"]

    fieldsets = (
        ("فایل", {"fields": ("file", "file_name", "file_type", "mime_type")}),
        ("اطلاعات", {"fields": ("file_size", "cdn_url", "uploaded_by")}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

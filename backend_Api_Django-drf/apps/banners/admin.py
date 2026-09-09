from django.contrib import admin
from django.utils.html import format_html
from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "image_preview",
        "placement",
        "order",
        "is_active",
        "starts_at",
        "ends_at",
    ]
    list_filter = ["placement", "is_active"]
    search_fields = ["title", "subtitle"]
    list_editable = ["order", "is_active"]
    ordering = ["order", "-created_at"]
    readonly_fields = ["image_preview", "created_at", "updated_at"]

    fieldsets = (
        (
            "اطلاعات اصلی",
            {"fields": ("title", "subtitle", "image", "image_preview", "link_url")},
        ),
        ("موقعیت نمایش", {"fields": ("placement", "order")}),
        ("وضعیت", {"fields": ("is_active", "starts_at", "ends_at")}),
        ("تاریخچه", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="60" style="object-fit:cover; border-radius:8px;" />',
                obj.image.url,
            )
        return "-"

    image_preview.short_description = "پیش‌نمایش تصویر"

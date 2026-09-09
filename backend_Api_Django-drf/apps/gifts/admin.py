from django.contrib import admin
from .models import Gift, GiftUsage


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "code",
        "type",
        "discount_type",
        "discount_value",
        "applies_to",
        "is_active",
        "used_count",
        "max_uses_per_user",
        "max_uses_total",
        "expires_at",
    ]
    list_display_links = ["title", "code"]
    list_filter = ["type", "discount_type", "applies_to", "is_active", "expires_at"]
    search_fields = ["title", "code", "description"]
    readonly_fields = ["used_count", "created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("title", "description", "type", "image")}),
        ("مقدار تخفیف", {"fields": ("discount_type", "discount_value")}),
        ("کد و اعتبار", {"fields": ("code", "expires_at")}),
        ("محدودیت‌ها", {"fields": ("max_uses_per_user", "max_uses_total", "users")}),
        ("قابل استفاده در", {"fields": ("applies_to",)}),
        ("تنظیمات", {"fields": ("is_active",)}),
        ("آمار استفاده", {"fields": ("used_count",), "classes": ("collapse",)}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def used_count(self, obj):
        return obj.usages.count()

    used_count.short_description = "تعداد استفاده"


@admin.register(GiftUsage)
class GiftUsageAdmin(admin.ModelAdmin):
    list_display = ["user", "gift", "order_type", "discounted_amount", "used_at"]
    list_display_links = ["user", "gift"]
    list_filter = ["order_type", "used_at", "gift__type"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "gift__code",
        "gift__title",
        "order_id",
    ]
    raw_id_fields = ["user", "gift"]
    readonly_fields = ["used_at"]
    ordering = ["-used_at"]

    fieldsets = (
        ("کاربر و هدیه", {"fields": ("user", "gift")}),
        ("اطلاعات سفارش", {"fields": ("order_id", "order_type", "discounted_amount")}),
        ("زمان استفاده", {"fields": ("used_at",)}),
    )

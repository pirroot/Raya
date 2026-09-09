from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    Category,
    Ad,
    AdImage,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Transaction,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "icon", "parent", "is_active"]
    list_filter = ["is_active", "parent"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["title"]


class AdImageInline(admin.TabularInline):
    model = AdImage
    extra = 3
    max_num = 5
    fields = ["image", "is_primary", "order"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit:cover; border-radius:8px;" />',
                obj.image.url,
            )
        return "-"

    image_preview.short_description = "پیش‌نمایش"


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "price",
        "condition",
        "status",
        "views",
        "is_featured",
        "is_sold",
        "created_at",
    ]
    list_filter = ["condition", "status", "is_featured", "is_sold"]
    search_fields = ["title", "description", "user__mobile"]
    readonly_fields = ["views", "created_at", "updated_at"]
    raw_id_fields = ["user", "category", "buyer"]
    ordering = ["-created_at"]
    inlines = [AdImageInline]
    actions = ["approve_ads", "reject_ads", "mark_as_sold"]

    fieldsets = (
        (
            "اطلاعات اصلی",
            {"fields": ("user", "category", "title", "description", "price")},
        ),
        (
            "وضعیت",
            {"fields": ("condition", "status", "is_featured", "is_sold", "sold_at")},
        ),
        ("محل تحویل", {"fields": ("campus", "location")}),
        (
            "خریدار و رزرو",
            {"fields": ("buyer", "reserved_until"), "classes": ("collapse",)},
        ),
        ("آمار", {"fields": ("views", "expires_at")}),
        ("تاریخچه", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def approve_ads(self, request, queryset):
        count = queryset.update(status=Ad.Status.APPROVED)
        self.message_user(request, f"{count} آگهی تایید شدند.")

    approve_ads.short_description = "✅ تایید آگهی‌های انتخاب شده"

    def reject_ads(self, request, queryset):
        count = queryset.update(status=Ad.Status.REJECTED)
        self.message_user(request, f"{count} آگهی رد شدند.")

    reject_ads.short_description = "❌ رد آگهی‌های انتخاب شده"

    def mark_as_sold(self, request, queryset):
        count = queryset.update(
            status=Ad.Status.SOLD, is_sold=True, sold_at=timezone.now()
        )
        self.message_user(request, f"{count} آگهی به عنوان فروخته شده علامت‌گذاری شد.")

    mark_as_sold.short_description = "💰 علامت‌گذاری به عنوان فروخته شده"


@admin.register(AdImage)
class AdImageAdmin(admin.ModelAdmin):
    list_display = ["ad", "image_preview", "is_primary", "order"]
    list_filter = ["is_primary"]
    search_fields = ["ad__title"]
    readonly_fields = ["image_preview"]
    ordering = ["ad", "order"]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit:cover; border-radius:8px;" />',
                obj.image.url,
            )
        return "-"

    image_preview.short_description = "پیش‌نمایش"


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    raw_id_fields = ["ad"]
    readonly_fields = ["item_total"]

    def item_total(self, obj):
        if obj.ad:
            return format_html("{} تومان", obj.ad.price * obj.quantity)
        return "-"

    item_total.short_description = "جمع"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["user", "total_price", "items_count", "created_at"]
    search_fields = ["user__mobile", "user__first_name"]
    raw_id_fields = ["user"]
    readonly_fields = ["total_price", "created_at", "updated_at"]
    inlines = [CartItemInline]

    def items_count(self, obj):
        return obj.cart_items.count()

    items_count.short_description = "تعداد آیتم‌ها"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    raw_id_fields = ["ad"]
    readonly_fields = ["item_total"]

    def item_total(self, obj):
        if obj.ad:
            return format_html("{} تومان", obj.price_at_time * obj.quantity)
        return "-"

    item_total.short_description = "جمع"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "user",
        "total_price",
        "discount_amount",
        "coupon_discount",
        "final_price",
        "status",
        "payment_method",
        "created_at",
    ]
    list_filter = ["status", "payment_method", "created_at"]
    search_fields = ["order_number", "user__mobile", "user__first_name", "coupon_code"]
    readonly_fields = ["order_number", "created_at", "updated_at"]
    raw_id_fields = ["user"]
    ordering = ["-created_at"]
    inlines = [OrderItemInline]
    actions = ["mark_as_paid", "mark_as_shipped", "mark_as_delivered"]

    fieldsets = (
        (
            "اطلاعات سفارش",
            {"fields": ("order_number", "user", "status", "payment_method")},
        ),
        (
            "مبالغ",
            {
                "fields": (
                    "total_price",
                    "discount_amount",
                    "coupon_discount",
                    "shipping_cost",
                    "final_price",
                )
            },
        ),
        ("کد تخفیف و آدرس", {"fields": ("coupon_code", "shipping_address")}),
        ("رزرو", {"fields": ("reserved_until",), "classes": ("collapse",)}),
        (
            "تاریخچه",
            {
                "fields": ("paid_at", "delivered_at", "created_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def mark_as_paid(self, request, queryset):
        count = queryset.update(status=Order.Status.PAID, paid_at=timezone.now())
        self.message_user(request, f"{count} سفارش به عنوان پرداخت شده علامت‌گذاری شد.")

    mark_as_paid.short_description = "💳 علامت‌گذاری به عنوان پرداخت شده"

    def mark_as_shipped(self, request, queryset):
        count = queryset.update(status=Order.Status.SHIPPED)
        self.message_user(request, f"{count} سفارش به عنوان ارسال شده علامت‌گذاری شد.")

    mark_as_shipped.short_description = "📦 علامت‌گذاری به عنوان ارسال شده"

    def mark_as_delivered(self, request, queryset):
        count = queryset.update(
            status=Order.Status.DELIVERED, delivered_at=timezone.now()
        )
        self.message_user(
            request, f"{count} سفارش به عنوان تحویل داده شده علامت‌گذاری شد."
        )

    mark_as_delivered.short_description = "✅ علامت‌گذاری به عنوان تحویل داده شده"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "from_user",
        "to_user",
        "amount",
        "type",
        "status",
        "created_at",
    ]
    list_filter = ["type", "status", "created_at"]
    search_fields = ["from_user__mobile", "to_user__mobile", "order__order_number"]
    raw_id_fields = ["from_user", "to_user", "order"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "اطلاعات تراکنش",
            {"fields": ("from_user", "to_user", "order", "amount", "type", "status")},
        ),
        ("توضیحات", {"fields": ("description", "reference_id")}),
        ("تاریخچه", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

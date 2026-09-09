from django.contrib import admin

from .models import CoinPackage, CoinTransaction


@admin.register(CoinPackage)
class CoinPackageAdmin(admin.ModelAdmin):
    list_display = ["title", "coin_amount", "price", "is_active"]
    list_display_links = ["title"]
    search_fields = ["title"]
    list_filter = ["is_active"]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات بسته", {"fields": ("title", "coin_amount", "price", "is_active")}),
    )


@admin.register(CoinTransaction)
class CoinTransactionAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "amount", "reason", "created_at"]
    list_filter = ["type", "reason"]
    search_fields = ["user__mobile", "reference_id"]
    autocomplete_fields = ["user"]
    readonly_fields = [f.name for f in CoinTransaction._meta.fields]

    fieldsets = (
        ("کاربر", {"fields": ("user",)}),
        ("تراکنش", {"fields": ("type", "amount", "reason", "reference_id")}),
        ("زمان", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def has_change_permission(self, request, obj=None):
        # Ledger is immutable — admins can view but not edit transactions.
        return False

    def has_delete_permission(self, request, obj=None):
        # تراکنش‌ها قابل حذف نیستند
        return False

    def has_add_permission(self, request):
        # تراکنش‌ها فقط از طریق کد ایجاد میشن، نه دستی
        return False

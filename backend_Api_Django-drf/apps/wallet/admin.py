from django.contrib import admin

from .models import WalletTransaction


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "amount", "status", "created_at"]
    list_display_links = ["user"]
    list_filter = ["type", "status", "created_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "gateway_ref",
        "reference",
    ]
    autocomplete_fields = ["user"]
    readonly_fields = ["balance_after", "created_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("کاربر", {"fields": ("user",)}),
        ("تراکنش", {"fields": ("type", "amount", "status", "description")}),
        ("ارجاع‌ها", {"fields": ("reference", "gateway_ref")}),
        (
            "موجودی پس از تراکنش",
            {"fields": ("balance_after",), "classes": ("collapse",)},
        ),
        ("تاریخ", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["user", "amount", "authority", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["user__mobile", "authority", "ref_id"]
    readonly_fields = ["authority", "created_at", "verified_at"]
    raw_id_fields = ["user"]

    fieldsets = (
        ("کاربر و مبلغ", {"fields": ("user", "amount", "description")}),
        (
            "اطلاعات پرداخت",
            {"fields": ("authority", "ref_id", "status", "card_pan", "card_hash")},
        ),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "verified_at"), "classes": ("collapse",)},
        ),
    )

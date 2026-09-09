from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class CoinPackage(BaseModel):
    """A purchasable bundle of coins, e.g. 100 coins for 50,000 Toman."""

    title = models.CharField(max_length=150)
    coin_amount = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "coins_packages"

    def __str__(self):
        return f"{self.title} ({self.coin_amount} coins)"


class CoinTransaction(BaseModel):
    """
    Immutable ledger of coin credits/debits.
    Balance is always derived from this ledger, never stored/mutated directly,
    to keep the coin economy auditable and consistent.
    """

    class Type(models.TextChoices):
        CREDIT = "credit", "افزایش"
        DEBIT = "debit", "کاهش"

    class Reason(models.TextChoices):
        PURCHASE = "purchase", "خرید سکه با پول"
        COURSE_ENROLLMENT = "course_enrollment", "ثبت‌نام در دوره"
        REFUND = "refund", "بازگشت سکه"
        ADMIN_ADJUSTMENT = "admin_adjustment", "تغییر توسط ادمین"
        CONVERT_FROM_WALLET = "convert_from_wallet", "تبدیل از کیف پول"
        SELL_NOTE = "sell_note", "فروش جزوه"
        DOWNLOAD_NOTE = "download_note", "دانلود جزوه"
        AI_CHAT = "ai_chat", "مکالمه با هوش مصنوعی"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coin_transactions",
    )
    amount = models.IntegerField()  # می‌تواند منفی باشد (برای DEBIT)
    type = models.CharField(max_length=20, choices=Type.choices)
    reason = models.CharField(max_length=30, choices=Reason.choices)
    reference_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "coins_transactions"
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user} {self.type} {self.amount}"

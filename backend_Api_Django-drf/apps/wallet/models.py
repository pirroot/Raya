# apps/wallet/models.py
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class Wallet(BaseModel):
    """کیف پول کاربر - موجودی پول نقد (تومان)"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet"
    )
    balance = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "wallets"

    def __str__(self):
        return f"{self.user.mobile} - {self.balance} تومان"

    def add_balance(self, amount: int):
        self.balance += amount
        self.save(update_fields=["balance"])

    def deduct_balance(self, amount: int):
        if self.balance < amount:
            raise ValueError("موجودی کافی نیست")
        self.balance -= amount
        self.save(update_fields=["balance"])

    @classmethod
    def get_or_create_admin_wallet(cls):
        """دریافت یا ایجاد کیف پول ادمین"""
        from apps.users.models import User

        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                mobile="09123456789", password="admin123"
            )
        wallet, created = cls.objects.get_or_create(user=admin_user)
        return wallet


class WalletTransaction(BaseModel):
    """تراکنش‌های کیف پول - تاریخچه کامل"""

    class Type(models.TextChoices):
        DEPOSIT = "deposit", "شارژ"
        WITHDRAWAL = "withdrawal", "برداشت"
        PAYOUT = "payout", "پرداخت به فروشنده"
        TRANSFER = "transfer", "انتقال"
        REFUND = "refund", "بازگشت وجه"
        FEE = "fee", "کارمزد"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        SUCCESS = "success", "موفق"
        FAILED = "failed", "ناموفق"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet_transactions",
    )
    amount = models.PositiveIntegerField()
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    description = models.TextField(blank=True)
    reference = models.CharField(max_length=150, blank=True)
    gateway_ref = models.CharField(max_length=150, blank=True)
    balance_after = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "wallet_transactions"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.user.mobile} - {self.type} - {self.amount} تومان"

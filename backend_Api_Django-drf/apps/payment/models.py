from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        PAID = "paid", "پرداخت شده"
        FAILED = "failed", "ناموفق"
        REFUNDED = "refunded", "برگشت خورده"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="کاربر",
    )
    amount = models.PositiveIntegerField(verbose_name="مبلغ (تومان)")
    authority = models.CharField(max_length=100, unique=True, verbose_name="شناسه مرجع")
    ref_id = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="شماره تراکنش"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )
    description = models.CharField(max_length=255, blank=True, verbose_name="توضیحات")
    card_pan = models.CharField(max_length=20, blank=True, verbose_name="شماره کارت")
    card_hash = models.CharField(max_length=100, blank=True, verbose_name="هش کارت")
    verified_at = models.DateTimeField(
        null=True, blank=True, verbose_name="تاریخ تایید"
    )

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]
        verbose_name = "پرداخت"
        verbose_name_plural = "پرداخت‌ها"

    def __str__(self):
        return f"{self.user} - {self.amount} - {self.status}"

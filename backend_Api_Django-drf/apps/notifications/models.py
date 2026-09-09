from datetime import timezone

from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Notification(BaseModel):
    class Type(models.TextChoices):
        AD_APPROVED = "ad_approved", "تایید آگهی"
        AD_REJECTED = "ad_rejected", "رد آگهی"
        AD_SOLD = "ad_sold", "فروش آگهی"
        NEW_MESSAGE = "new_message", "پیام جدید"
        PAYMENT_SUCCESS = "payment_success", "پرداخت موفق"
        PAYMENT_FAILED = "payment_failed", "پرداخت ناموفق"
        ORDER_STATUS = "order_status", "تغییر وضعیت سفارش"
        SYSTEM = "system", "سیستمی"

    class Priority(models.TextChoices):
        LOW = "low", "کم"
        NORMAL = "normal", "متوسط"
        HIGH = "high", "بالا"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=50, choices=Type.choices)
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.user.mobile} - {self.title}"

    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=["is_read", "read_at"])

from django.db import models
from apps.common.models import BaseModel


class ContactMessage(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        READ = "read", "خوانده شده"
        REPLIED = "replied", "پاسخ داده شده"

    name = models.CharField(max_length=150, verbose_name="نام")
    mobile = models.CharField(max_length=15, verbose_name="شماره موبایل")
    message = models.TextField(verbose_name="پیام")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )

    class Meta:
        db_table = "contact_messages"
        ordering = ["-created_at"]
        verbose_name = "پیام تماس"
        verbose_name_plural = "پیام‌های تماس"

    def __str__(self):
        return f"{self.name} - {self.mobile}"

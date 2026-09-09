from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
import uuid


class Certificate(BaseModel):
    """گواهی پایان دوره"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
        verbose_name="کاربر",
    )
    course = models.ForeignKey(
        "education.Course",
        on_delete=models.CASCADE,
        related_name="certificates",
        verbose_name="دوره",
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="کد گواهی",
    )
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ صدور")
    certificate_file = models.FileField(
        upload_to="certificates/%Y/%m/%d/",
        blank=True,
        null=True,
        verbose_name="فایل گواهی",
    )
    is_verified = models.BooleanField(default=True, verbose_name="تایید شده")

    class Meta:
        db_table = "certificates"
        unique_together = [["user", "course"]]
        ordering = ["-issued_at"]
        verbose_name = "گواهی"
        verbose_name_plural = "گواهی‌ها"

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.course.title}"

    def get_verify_url(self):
        """آدرس اعتبارسنجی گواهی"""
        return f"/verify-certificate/{self.code}/"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = str(uuid.uuid4()).replace("-", "")[:16].upper()
        super().save(*args, **kwargs)

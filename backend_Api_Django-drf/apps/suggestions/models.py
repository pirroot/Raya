from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Suggestion(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        APPROVED = "approved", "پذیرفته شده"
        REJECTED = "rejected", "رد شده"

    title = models.CharField(max_length=200, verbose_name="عنوان")
    content = models.TextField(verbose_name="محتوا")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="suggestions",
        verbose_name="کاربر",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )
    likes = models.PositiveIntegerField(default=0, verbose_name="تعداد لایک")
    liked_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="liked_suggestions",
        blank=True,
        verbose_name="لایک‌کننده‌ها",
    )

    class Meta:
        db_table = "suggestions"
        ordering = ["-created_at"]
        verbose_name = "پیشنهاد"
        verbose_name_plural = "پیشنهادات"

    def __str__(self):
        return self.title

    def toggle_like(self, user):
        if user in self.liked_by.all():
            self.liked_by.remove(user)
            self.likes -= 1
        else:
            self.liked_by.add(user)
            self.likes += 1
        self.save()
        return self.likes

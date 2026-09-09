from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Competition(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "در حال برگزاری"
        UPCOMING = "upcoming", "به زودی"
        ENDED = "ended", "پایان یافته"

    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    prize = models.CharField(max_length=200, verbose_name="جایزه")
    deadline = models.DateTimeField(verbose_name="مهلت ثبت نام")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING,
        verbose_name="وضعیت",
    )
    participants_count = models.PositiveIntegerField(
        default=0, verbose_name="تعداد شرکت‌کنندگان"
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "competitions"
        ordering = ["-created_at"]
        verbose_name = "مسابقه"
        verbose_name_plural = "مسابقات"

    def __str__(self):
        return self.title


class CompetitionRegistration(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="competition_registrations",
    )
    competition = models.ForeignKey(
        Competition, on_delete=models.CASCADE, related_name="registrations"
    )

    class Meta:
        db_table = "competition_registrations"
        unique_together = [["user", "competition"]]
        verbose_name = "ثبت نام مسابقه"
        verbose_name_plural = "ثبت نام‌های مسابقات"

    def __str__(self):
        return f"{self.user.mobile} - {self.competition.title}"

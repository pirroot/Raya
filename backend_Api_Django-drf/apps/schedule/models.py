from django.db import models
from apps.common.models import BaseModel


class ClassSchedule(BaseModel):
    class Day(models.TextChoices):
        SATURDAY = "شنبه", "شنبه"
        SUNDAY = "یکشنبه", "یکشنبه"
        MONDAY = "دوشنبه", "دوشنبه"
        TUESDAY = "سه‌شنبه", "سه‌شنبه"
        WEDNESDAY = "چهارشنبه", "چهارشنبه"
        THURSDAY = "پنجشنبه", "پنجشنبه"
        FRIDAY = "جمعه", "جمعه"

    course_name = models.CharField(max_length=200, verbose_name="نام درس")
    teacher = models.CharField(max_length=150, verbose_name="استاد")
    day = models.CharField(max_length=20, choices=Day.choices, verbose_name="روز")
    time_start = models.TimeField(verbose_name="ساعت شروع")
    time_end = models.TimeField(verbose_name="ساعت پایان")
    faculty = models.CharField(max_length=150, verbose_name="دانشکده")
    room = models.CharField(max_length=50, blank=True, verbose_name="سالن/کلاس")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")

    class Meta:
        db_table = "schedule"
        ordering = ["day", "time_start", "order"]
        verbose_name = "برنامه کلاسی"
        verbose_name_plural = "برنامه‌های کلاسی"

    def __str__(self):
        return f"{self.course_name} - {self.teacher} ({self.day})"

    @property
    def time(self):
        return (
            f"{self.time_start.strftime('%H:%M')} - {self.time_end.strftime('%H:%M')}"
        )

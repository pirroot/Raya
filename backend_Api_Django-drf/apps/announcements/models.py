from django.db import models
from apps.common.models import BaseModel


class Announcement(BaseModel):
    title = models.CharField(max_length=200, verbose_name="عنوان")
    content = models.TextField(verbose_name="محتوا")
    date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ")
    is_pinned = models.BooleanField(default=False, verbose_name="چسبیده")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "announcements"
        ordering = ["-is_pinned", "-date"]
        verbose_name = "اطلاعیه"
        verbose_name_plural = "اطلاعیه‌ها"

    def __str__(self):
        return self.title

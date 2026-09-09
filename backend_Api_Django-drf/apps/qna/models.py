from django.db import models
from apps.common.models import BaseModel


class QA(BaseModel):
    """پرسش و پاسخ"""

    question = models.CharField(max_length=500, verbose_name="سوال")
    answer = models.TextField(verbose_name="پاسخ")
    author = models.CharField(max_length=100, default="مدیریت", verbose_name="نویسنده")
    likes = models.PositiveIntegerField(default=0, verbose_name="لایک")
    views = models.PositiveIntegerField(default=0, verbose_name="بازدید")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "qna"
        ordering = ["order", "created_at"]
        verbose_name = "پرسش و پاسخ"
        verbose_name_plural = "پرسش و پاسخ‌ها"

    def __str__(self):
        return self.question

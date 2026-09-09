from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Poll(BaseModel):
    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    starts_at = models.DateTimeField(verbose_name="شروع")
    ends_at = models.DateTimeField(verbose_name="پایان")

    class Meta:
        db_table = "polls"
        ordering = ["-created_at"]
        verbose_name = "نظرسنجی"
        verbose_name_plural = "نظرسنجی‌ها"

    def __str__(self):
        return self.title

    @property
    def total_votes(self):
        return self.options.aggregate(total=models.Sum("votes"))["total"] or 0


class PollOption(BaseModel):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    label = models.CharField(max_length=200, verbose_name="گزینه")
    votes = models.PositiveIntegerField(default=0, verbose_name="تعداد رأی")

    class Meta:
        db_table = "poll_options"
        ordering = ["created_at"]
        verbose_name = "گزینه نظرسنجی"
        verbose_name_plural = "گزینه‌های نظرسنجی"

    def __str__(self):
        return f"{self.poll.title} - {self.label}"


class PollVote(BaseModel):
    """ثبت رأی کاربر"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="poll_votes"
    )
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="votes")
    option = models.ForeignKey(
        PollOption, on_delete=models.CASCADE, related_name="votes_received"
    )

    class Meta:
        db_table = "poll_votes"
        unique_together = [["user", "poll"]]  # هر کاربر فقط یک بار میتونه رأی بده
        verbose_name = "رأی"
        verbose_name_plural = "آراء"

    def __str__(self):
        return f"{self.user.mobile} - {self.poll.title}"

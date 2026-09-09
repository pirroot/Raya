from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class AiSession(BaseModel):
    """گفتگوی کاربر با AI"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_sessions"
    )
    title = models.CharField(max_length=255, blank=True, default="گفتگوی جدید")
    settings = models.JSONField(default=dict, blank=True)  # customPrompt, model, etc

    class Meta:
        db_table = "ai_sessions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.mobile} - {self.title}"


class AiMessage(BaseModel):
    """پیام‌های گفتگو"""

    class Role(models.TextChoices):
        USER = "USER", "کاربر"
        ASSISTANT = "ASSISTANT", "دستیار"
        SYSTEM = "SYSTEM", "سیستم"

    class Status(models.TextChoices):
        COMPLETED = "completed", "تکمیل شده"
        PROCESSING = "processing", "در حال پردازش"
        ERROR = "error", "خطا"

    session = models.ForeignKey(
        AiSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.COMPLETED
    )
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)
    coins_charged = models.PositiveIntegerField(default=0)
    file_ids = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "ai_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role} - {self.content[:50]}"


class AiFile(BaseModel):
    """فایل‌های آپلود شده برای AI"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_files"
    )
    session = models.ForeignKey(
        AiSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="files",
    )
    file = models.FileField(upload_to="ai_files/%Y/%m/%d/")
    filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField()
    has_extracted_text = models.BooleanField(default=False)

    class Meta:
        db_table = "ai_files"

    def __str__(self):
        return self.filename


class AiUsage(BaseModel):
    """مصرف روزانه کاربر"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_usage"
    )
    daily_free_limit = models.PositiveIntegerField(default=settings.AI_DAILY_FREE_LIMIT)
    used_free_messages = models.PositiveIntegerField(default=0)
    paid_messages = models.PositiveIntegerField(default=0)
    coin_cost_per_message = models.PositiveIntegerField(
        default=settings.AI_COIN_COST_PER_MESSAGE
    )
    free_window_ends_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_usage"

    def __str__(self):
        return f"{self.user.mobile} - {self.used_free_messages}/{self.daily_free_limit}"

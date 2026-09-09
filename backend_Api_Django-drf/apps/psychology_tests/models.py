from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class PsychologyTest(BaseModel):
    class Level(models.TextChoices):
        SIMPLE = "simple", "ساده"
        MEDIUM = "medium", "متوسط"
        ADVANCED = "advanced", "پیشرفته"

    class Category(models.TextChoices):
        PERSONALITY = "personality", "شخصیت شناسی"
        IQ = "iq", "هوش و استعداد"
        ACADEMIC = "academic", "تحصیلی"
        PSYCHOLOGY = "psychology", "روانشناسی"
        EMOTIONAL = "emotional", "هوش هیجانی"

    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    category = models.CharField(max_length=50, choices=Category.choices, verbose_name="دسته‌بندی")
    price = models.PositiveIntegerField(default=0, verbose_name="قیمت (تومان)")
    coin_price = models.PositiveIntegerField(default=0, verbose_name="قیمت (سکه)")
    duration = models.PositiveIntegerField(default=10, verbose_name="زمان (دقیقه)")
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.SIMPLE, verbose_name="سطح")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name="امتیاز")
    reviews = models.PositiveIntegerField(default=0, verbose_name="تعداد نظرات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    image = models.ForeignKey(
        "storage.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="psychology_tests"
    )

    class Meta:
        db_table = "psychology_tests"
        ordering = ["-created_at"]
        verbose_name = "تست روانشناسی"
        verbose_name_plural = "تست‌های روانشناسی"

    def __str__(self):
        return self.title

    @property
    def questions_count(self):
        return self.questions.count()


class TestQuestion(BaseModel):
    test = models.ForeignKey(
        PsychologyTest,
        on_delete=models.CASCADE,
        related_name="questions"
    )
    question = models.TextField(verbose_name="سوال")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")

    class Meta:
        db_table = "test_questions"
        ordering = ["order"]
        verbose_name = "سوال تست"
        verbose_name_plural = "سوالات تست"

    def __str__(self):
        return f"{self.test.title} - سوال {self.order + 1}"


class TestOption(BaseModel):
    question = models.ForeignKey(
        TestQuestion,
        on_delete=models.CASCADE,
        related_name="options"
    )
    label = models.CharField(max_length=200, verbose_name="گزینه")
    score = models.IntegerField(default=0, verbose_name="امتیاز")
    is_correct = models.BooleanField(default=False, verbose_name="پاسخ صحیح")

    class Meta:
        db_table = "test_options"
        verbose_name = "گزینه سوال"
        verbose_name_plural = "گزینه‌های سوال"

    def __str__(self):
        return f"{self.question.question[:30]} - {self.label}"


class TestAttempt(BaseModel):
    """ثبت تلاش کاربر برای تست"""
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "در حال انجام"
        COMPLETED = "completed", "تکمیل شده"
        ABANDONED = "abandoned", "رها شده"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_attempts"
    )
    test = models.ForeignKey(
        PsychologyTest,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        verbose_name="وضعیت"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(default=0, verbose_name="امتیاز")
    total_questions = models.PositiveIntegerField(default=0, verbose_name="تعداد سوالات")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="درصد")

    class Meta:
        db_table = "test_attempts"
        unique_together = [["user", "test"]]  # هر کاربر فقط یک بار میتونه تست رو انجام بده
        verbose_name = "تلاش تست"
        verbose_name_plural = "تلاش‌های تست"

    def __str__(self):
        return f"{self.user.mobile} - {self.test.title}"

    def calculate_percentage(self):
        if self.total_questions > 0:
            self.percentage = (self.score / self.total_questions) * 100
        else:
            self.percentage = 0
        self.save(update_fields=["percentage"])


class TestAnswer(BaseModel):
    """پاسخ‌های کاربر به سوالات"""
    attempt = models.ForeignKey(
        TestAttempt,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    question = models.ForeignKey(
        TestQuestion,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    selected_option = models.ForeignKey(
        TestOption,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    is_correct = models.BooleanField(default=False, verbose_name="پاسخ صحیح")

    class Meta:
        db_table = "test_answers"
        verbose_name = "پاسخ تست"
        verbose_name_plural = "پاسخ‌های تست"

    def __str__(self):
        return f"{self.attempt.user.mobile} - {self.question.question[:30]}"

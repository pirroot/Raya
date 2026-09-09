# apps/question_bank/models.py
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
import uuid
import os


class Category(BaseModel):
    title = models.CharField(max_length=100, verbose_name="عنوان")
    slug = models.SlugField(unique=True, verbose_name="اسلاگ")
    icon = models.CharField(max_length=50, blank=True, verbose_name="آیکون")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "question_categories"
        verbose_name = "دسته‌بندی"
        verbose_name_plural = "دسته‌بندی‌ها"

    def __str__(self):
        return self.title


class Question(BaseModel):
    class PriceType(models.TextChoices):
        FREE = "free", "رایگان"
        PAID = "paid", "پولی"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="کاربر",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="دسته‌بندی",
    )
    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    teacher = models.CharField(max_length=100, blank=True, verbose_name="مدرس")

    # Pricing
    price_type = models.CharField(
        max_length=10,
        choices=PriceType.choices,
        default=PriceType.FREE,
        verbose_name="نوع قیمت",
    )
    price = models.PositiveIntegerField(default=0, verbose_name="قیمت (تومان)")

    # File
    file = models.FileField(upload_to="question_bank/%Y/%m/%d/", verbose_name="فایل")
    file_name = models.CharField(max_length=255, verbose_name="نام فایل")
    file_size = models.PositiveIntegerField(default=0, verbose_name="حجم فایل")
    file_mime_type = models.CharField(
        max_length=100, blank=True, verbose_name="نوع فایل"
    )

    # Stats
    views = models.PositiveIntegerField(default=0, verbose_name="بازدید")
    downloads = models.PositiveIntegerField(default=0, verbose_name="دانلود")
    likes = models.PositiveIntegerField(default=0, verbose_name="لایک")

    # Status
    is_featured = models.BooleanField(default=False, verbose_name="ویژه")
    is_approved = models.BooleanField(default=False, verbose_name="تایید شده")

    # ✅ خریداران
    purchased_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="purchased_questions",
        blank=True,
        verbose_name="خریداری شده توسط",
    )

    # ✅ کد تخفیف اعمال شده روی این سوال
    coupon_code = models.CharField(max_length=50, blank=True, verbose_name="کد تخفیف")
    coupon_discount = models.PositiveIntegerField(
        default=0, verbose_name="تخفیف اعمال شده"
    )

    class Meta:
        db_table = "questions"
        ordering = ["-created_at"]
        verbose_name = "سوال"
        verbose_name_plural = "سوالات"

    def __str__(self):
        return self.title

    @property
    def final_price(self):
        """قیمت نهایی بعد از تخفیف"""
        if self.price_type == self.PriceType.FREE:
            return 0
        return max(0, self.price - self.coupon_discount)

    def get_coin_price(self):
        from django.conf import settings

        if self.price_type == self.PriceType.PAID and self.price > 0:
            rate = getattr(settings, "COIN_RATE", 1000)
            return self.price // rate
        return 0

    def save(self, *args, **kwargs):
        if self.file and not self.pk:
            ext = os.path.splitext(self.file.name)[1]
            random_name = f"{uuid.uuid4().hex}{ext}"
            self.file.name = random_name
            self.file_name = random_name

        super().save(*args, **kwargs)


class QuestionDownload(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_downloads",
        verbose_name="کاربر",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="downloads_log",
        verbose_name="سوال",
    )
    coins_spent = models.PositiveIntegerField(default=0, verbose_name="سکه مصرف شده")
    is_first_download = models.BooleanField(default=True, verbose_name="اولین دانلود")
    downloaded_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان دانلود")

    class Meta:
        db_table = "question_downloads"
        unique_together = [["user", "question"]]
        verbose_name = "دانلود سوال"
        verbose_name_plural = "دانلودهای سوالات"

    def __str__(self):
        return f"{self.user} - {self.question}"


class QuestionLike(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_likes",
        verbose_name="کاربر",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="likes_log",
        verbose_name="سوال",
    )

    class Meta:
        db_table = "question_likes"
        unique_together = [["user", "question"]]
        verbose_name = "لایک سوال"
        verbose_name_plural = "لایک‌های سوالات"

    def __str__(self):
        return f"{self.user} liked {self.question}"


class QuestionPurchase(BaseModel):
    """خرید سوال توسط کاربر (برای سوالات پولی)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_purchases",
        verbose_name="کاربر",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="purchases",
        verbose_name="سوال",
    )
    price_paid = models.PositiveIntegerField(default=0, verbose_name="قیمت پرداخت شده")
    coupon_code = models.CharField(max_length=50, blank=True, verbose_name="کد تخفیف")
    coupon_discount = models.PositiveIntegerField(
        default=0, verbose_name="تخفیف اعمال شده"
    )
    is_downloaded = models.BooleanField(default=False, verbose_name="دانلود شده")
    downloaded_at = models.DateTimeField(
        null=True, blank=True, verbose_name="زمان دانلود"
    )

    class Meta:
        db_table = "question_purchases"
        unique_together = [["user", "question"]]
        verbose_name = "خرید سوال"
        verbose_name_plural = "خریدهای سوالات"

    def __str__(self):
        return f"{self.user} - {self.question} - {self.price_paid} تومان"

# apps/gifts/models.py
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common.models import BaseModel


class Gift(BaseModel):
    class Type(models.TextChoices):
        DISCOUNT = "discount", "تخفیف"
        GIFT = "gift", "هدیه"
        VOUCHER = "voucher", "اشتراک"

    class DiscountType(models.TextChoices):
        PERCENT = "percent", "درصدی"
        AMOUNT = "amount", "مبلغی"

    class AppliesTo(models.TextChoices):
        ALL = "all", "همه"
        MARKET = "market", "فروشگاه"
        COURSES = "courses", "دوره‌ها"
        BOOKS = "books", "جزوه‌ها"

    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    type = models.CharField(max_length=20, choices=Type.choices, verbose_name="نوع")

    discount_type = models.CharField(
        max_length=10,
        choices=DiscountType.choices,
        default=DiscountType.PERCENT,
        verbose_name="نوع تخفیف",
    )
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=0, default=0, verbose_name="مقدار تخفیف"
    )

    code = models.CharField(max_length=50, unique=True, verbose_name="کد")
    expires_at = models.DateTimeField(verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    max_uses_per_user = models.PositiveIntegerField(
        default=1, verbose_name="حداکثر استفاده هر کاربر"
    )
    max_uses_total = models.PositiveIntegerField(
        default=0, verbose_name="حداکثر استفاده کل"
    )

    applies_to = models.CharField(
        max_length=20,
        choices=AppliesTo.choices,
        default=AppliesTo.ALL,
        verbose_name="قابل استفاده در",
    )

    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="assigned_gifts",
        verbose_name="کاربران خاص",
    )

    image = models.ForeignKey(
        "storage.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gifts",
    )

    class Meta:
        db_table = "gifts"
        ordering = ["-created_at"]
        verbose_name = "هدیه"
        verbose_name_plural = "هدایا"

    def __str__(self):
        return f"{self.title} - {self.code}"

    @property
    def used_count(self):
        return self.usages.count()

    def is_valid_for_user(self, user):
        if not self.is_active:
            return False, "کد تخفیف غیرفعال است"

        if self.expires_at and timezone.now() > self.expires_at:
            return False, "کد تخفیف منقضی شده است"

        if self.users.exists() and user not in self.users.all():
            return False, "این کد تخفیف برای شما قابل استفاده نیست"

        user_uses = self.usages.filter(user=user).count()
        if user_uses >= self.max_uses_per_user:
            return False, "شما از سقف مجاز استفاده کرده‌اید"

        if self.max_uses_total > 0 and self.used_count >= self.max_uses_total:
            return False, "سقف استفاده از این کد تکمیل شده است"

        return True, "کد تخفیف معتبر است"

    def calculate_discount(self, total_amount):
        if self.discount_type == self.DiscountType.PERCENT:
            return int(total_amount * (self.discount_value / 100))
        else:
            return min(int(self.discount_value), total_amount)


class GiftUsage(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="gift_usages"
    )
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name="usages")
    order_id = models.CharField(max_length=100, verbose_name="شناسه سفارش")
    order_type = models.CharField(
        max_length=20, choices=Gift.AppliesTo.choices, verbose_name="نوع سفارش"
    )
    discounted_amount = models.DecimalField(
        max_digits=10, decimal_places=0, verbose_name="مبلغ تخفیف"
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "gift_usages"
        unique_together = [["user", "gift"]]
        verbose_name = "استفاده از هدیه"
        verbose_name_plural = "استفاده‌های هدیه"

    def __str__(self):
        return f"{self.user.mobile} - {self.gift.code}"

# apps/market/models.py - پاک کردن کامل Coupon و CouponUsage

from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import BaseModel


class Category(BaseModel):
    title = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "market_categories"
        ordering = ["title"]

    def __str__(self):
        return self.title


class Ad(BaseModel):
    class Condition(models.TextChoices):
        NEW = "new", "نو"
        LIKE_NEW = "like_new", "در حد نو"
        USED = "used", "کارکرده"
        NEEDS_REPAIR = "needs_repair", "نیازمند تعمیر"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار تایید"
        APPROVED = "approved", "تایید شده"
        REJECTED = "rejected", "رد شده"
        EXPIRED = "expired", "منقضی شده"
        SOLD = "sold", "فروخته شده"
        RESERVED = "reserved", "رزرو شده"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="market_ads",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="ads",
    )
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=1000)
    price = models.PositiveIntegerField()
    condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        default=Condition.USED,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    campus = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    views = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_sold = models.BooleanField(default=False)
    sold_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    reserved_until = models.DateTimeField(null=True, blank=True)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchased_ads",
    )

    class Meta:
        db_table = "market_ads"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.price:,}"


class AdImage(BaseModel):
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        upload_to="market/ads/%Y/%m/%d/",
    )
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "market_ad_images"
        ordering = ["order"]

    def __str__(self):
        return f"{self.ad.title} - تصویر {self.order}"


class Cart(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="market_cart",
    )
    total_price = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "market_carts"

    def __str__(self):
        return f"سبد خرید {self.user}"

    def update_total(self):
        total = sum(item.ad.price * item.quantity for item in self.cart_items.all())
        self.total_price = total
        self.save(update_fields=["total_price"])


class CartItem(BaseModel):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "market_cart_items"
        unique_together = [["cart", "ad"]]

    def __str__(self):
        return f"{self.ad.title} x {self.quantity}"


class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار پرداخت"
        PAID = "paid", "پرداخت شده"
        PROCESSING = "processing", "در حال پردازش"
        SHIPPED = "shipped", "ارسال شده"
        DELIVERED = "delivered", "تحویل داده شده"
        CANCELLED = "cancelled", "لغو شده"
        REFUNDED = "refunded", "برگشت خورده"

    class PaymentMethod(models.TextChoices):
        WALLET = "wallet", "کیف پول"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="market_orders",
    )
    order_number = models.CharField(
        max_length=50,
        unique=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.WALLET,
    )
    total_price = models.PositiveIntegerField()
    discount_amount = models.PositiveIntegerField(default=0)
    final_price = models.PositiveIntegerField(default=0)
    shipping_address = models.TextField(blank=True)
    shipping_cost = models.PositiveIntegerField(default=0)
    coupon_code = models.CharField(max_length=50, blank=True)  # کد تخفیف از Gift
    coupon_discount = models.PositiveIntegerField(default=0)  # مقدار تخفیف اعمال شده
    paid_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    reserved_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "market_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.order_number} - {self.user}"


class OrderItem(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="order_items",
    )
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField()
    price_at_time = models.PositiveIntegerField()

    class Meta:
        db_table = "market_order_items"

    def __str__(self):
        return f"{self.ad.title} x {self.quantity}"


class Transaction(BaseModel):
    class Type(models.TextChoices):
        PURCHASE = "purchase", "خرید"
        SALE = "sale", "فروش"
        REFUND = "refund", "برگشت وجه"
        FEE = "fee", "کارمزد"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار"
        COMPLETED = "completed", "تکمیل شده"
        FAILED = "failed", "ناموفق"

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_transactions",
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_transactions",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    amount = models.PositiveIntegerField()
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    description = models.CharField(max_length=255, blank=True)
    reference_id = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "market_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.from_user} -> {self.to_user}: {self.amount}"

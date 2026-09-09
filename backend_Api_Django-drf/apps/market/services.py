import uuid
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.market.models import (
    Category,
    Ad,
    AdImage,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Transaction,
)
from apps.wallet.models import WalletTransaction
from apps.coins.models import CoinTransaction
from apps.common.exceptions import APIException
from apps.wallet.services import WalletService
from apps.gifts.models import Gift, GiftUsage
from apps.gifts.services import GiftService

logger = logging.getLogger(__name__)


class MarketService:

    def __init__(self, user):
        self.user = user

    # ===== Category =====
    def get_categories(self, parent_id=None):
        queryset = Category.objects.filter(is_active=True)
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            queryset = queryset.filter(parent__isnull=True)
        return queryset

    def create_category(self, data):
        return Category.objects.create(**data)

    def update_category(self, category_id, data):
        category = Category.objects.get(id=category_id)
        for key, value in data.items():
            setattr(category, key, value)
        category.save()
        return category

    # ===== Ad =====
    def get_ads(self, filters=None):
        queryset = Ad.objects.filter(
            status=Ad.Status.APPROVED,
            is_sold=False,
        )

        if filters:
            if filters.get("category"):
                queryset = queryset.filter(category_id=filters["category"])
            if filters.get("search"):
                queryset = queryset.filter(title__icontains=filters["search"])
            if filters.get("condition"):
                queryset = queryset.filter(condition=filters["condition"])
            if filters.get("min_price"):
                queryset = queryset.filter(price__gte=filters["min_price"])
            if filters.get("max_price"):
                queryset = queryset.filter(price__lte=filters["max_price"])
            if filters.get("is_featured"):
                queryset = queryset.filter(is_featured=True)

        return queryset

    def get_ad_detail(self, ad_id):
        ad = Ad.objects.get(id=ad_id, status=Ad.Status.APPROVED)
        ad.views += 1
        ad.save(update_fields=["views"])
        return ad

    def create_ad(self, data, images_data=None):
        with transaction.atomic():
            data["user"] = self.user
            data["status"] = Ad.Status.PENDING
            ad = Ad.objects.create(**data)

            if images_data:
                for i, image_data in enumerate(images_data):
                    AdImage.objects.create(
                        ad=ad,
                        image=image_data,
                        is_primary=i == 0,
                        order=i,
                    )

            return ad

    def update_ad(self, ad_id, data, images_data=None):
        with transaction.atomic():
            ad = Ad.objects.get(id=ad_id, user=self.user)

            if ad.status != Ad.Status.PENDING:
                raise APIException("فقط آگهی‌های در انتظار تایید قابل ویرایش هستند")

            for key, value in data.items():
                setattr(ad, key, value)
            ad.save()

            if images_data:
                ad.images.all().delete()
                for i, image_data in enumerate(images_data):
                    AdImage.objects.create(
                        ad=ad,
                        image=image_data,
                        is_primary=i == 0,
                        order=i,
                    )

            return ad

    def delete_ad(self, ad_id):
        ad = Ad.objects.get(id=ad_id, user=self.user)
        if ad.status in [Ad.Status.SOLD, Ad.Status.APPROVED]:
            raise APIException("این آگهی قابل حذف نیست")
        ad.delete()
        return True

    def get_user_ads(self):
        return Ad.objects.filter(user=self.user)

    def mark_as_sold(self, ad_id):
        ad = Ad.objects.get(id=ad_id, user=self.user)
        ad.status = Ad.Status.SOLD
        ad.is_sold = True
        ad.sold_at = timezone.now()
        ad.save()
        return ad

    def reserve_ad(self, ad_id, buyer):
        """رزرو آگهی برای خریدار به مدت ۴۸ ساعت"""
        ad = Ad.objects.get(id=ad_id)
        if ad.is_sold:
            raise APIException("این آگهی قبلاً فروخته شده است")

        ad.status = Ad.Status.RESERVED
        ad.buyer = buyer
        ad.reserved_until = timezone.now() + timezone.timedelta(hours=48)
        ad.save()
        return ad

    def confirm_delivery(self, ad_id):
        """تایید دریافت توسط خریدار"""
        ad = Ad.objects.get(id=ad_id, buyer=self.user)
        if ad.status != Ad.Status.RESERVED:
            raise APIException("این آگهی در وضعیت رزرو نیست")

        ad.status = Ad.Status.SOLD
        ad.is_sold = True
        ad.sold_at = timezone.now()
        ad.reserved_until = None
        ad.save()
        return ad

    # ===== Cart =====
    def get_or_create_cart(self):
        cart, created = Cart.objects.get_or_create(user=self.user)
        return cart

    def add_to_cart(self, ad_id, quantity=1):
        ad = Ad.objects.get(id=ad_id, status=Ad.Status.APPROVED, is_sold=False)

        from apps.market.models import OrderItem

        has_purchased = OrderItem.objects.filter(
            ad=ad,
            order__user=self.user,
            order__status__in=[Order.Status.PAID, Order.Status.DELIVERED],
        ).exists()

        if has_purchased:
            raise APIException("شما قبلاً این محصول را خریداری کرده‌اید")

        cart = self.get_or_create_cart()

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, ad=ad, defaults={"quantity": quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        cart.update_total()
        return cart

    def update_cart_item(self, cart_item_id, quantity):
        cart_item = CartItem.objects.get(id=cart_item_id, cart__user=self.user)

        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        cart_item.cart.update_total()
        return cart_item.cart

    def remove_from_cart(self, cart_item_id):
        cart_item = CartItem.objects.get(id=cart_item_id, cart__user=self.user)
        cart = cart_item.cart
        cart_item.delete()
        cart.update_total()
        return cart

    def clear_cart(self):
        cart = self.get_or_create_cart()
        cart.cart_items.all().delete()
        cart.total_price = 0
        cart.save()
        return cart

    # ===== Order =====
    def create_order(self, data):
        with transaction.atomic():
            cart = self.get_or_create_cart()

            if not cart.cart_items.exists():
                raise APIException("سبد خرید شما خالی است")

            total_price = cart.total_price

            discount_amount = 0
            coupon_code = data.get("coupon_code", "")
            coupon_discount = 0

            if coupon_code:
                try:
                    result = GiftService.apply_gift(
                        code=coupon_code,
                        user=self.user,
                        order_id=f"ORDER-{uuid.uuid4().hex[:8].upper()}",
                        order_type=Gift.AppliesTo.MARKET,
                        total_amount=total_price,
                    )
                    discount_amount = result["discount"]
                    coupon_discount = result["discount"]
                except ValidationError as e:
                    raise APIException(str(e))

            final_price = total_price - discount_amount + data.get("shipping_cost", 0)

            order_number = f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            order = Order.objects.create(
                user=self.user,
                order_number=order_number,
                status=Order.Status.PENDING,
                payment_method=data["payment_method"],
                total_price=total_price,
                discount_amount=discount_amount,
                coupon_discount=coupon_discount,
                final_price=final_price,
                shipping_address=data.get("address", ""),
                shipping_cost=data.get("shipping_cost", 0),
                coupon_code=coupon_code,
            )

            for cart_item in cart.cart_items.all():
                OrderItem.objects.create(
                    order=order,
                    ad=cart_item.ad,
                    quantity=cart_item.quantity,
                    price_at_time=cart_item.ad.price,
                )

            cart.cart_items.all().delete()
            cart.total_price = 0
            cart.save()

            if data["payment_method"] == Order.PaymentMethod.WALLET:
                self._process_wallet_payment(order)
            else:
                pass

            return order

    def _process_wallet_payment(self, order):
        """پرداخت از طریق کیف پول با کارمزد ۱۰٪"""

        fee_percent = 10
        total_fee = int(order.final_price * fee_percent / 100)
        seller_total = order.final_price - total_fee

        wallet_service = WalletService(self.user)
        balance = wallet_service.get_balance()

        if balance < order.final_price:
            raise APIException("موجودی کیف پول شما کافی نیست")

        wallet_service.debit(
            amount=order.final_price,
            description=f"پرداخت سفارش #{order.order_number}",
            reference=str(order.id),
        )

        for order_item in order.order_items.all():
            seller = order_item.ad.user
            item_total = order_item.price_at_time * order_item.quantity
            item_fee = int(item_total * fee_percent / 100)
            item_seller_amount = item_total - item_fee

            Transaction.objects.create(
                from_user=self.user,
                to_user=seller,
                order=order,
                amount=item_total,
                type=Transaction.Type.PURCHASE,
                status=Transaction.Status.COMPLETED,
                description=f"خرید {order_item.ad.title} - سفارش #{order.order_number}",
            )

            seller_wallet = WalletService(seller)
            seller_wallet.credit(
                amount=item_seller_amount,
                description=f"فروش {order_item.ad.title} - سفارش #{order.order_number} (کارمزد {fee_percent}%)",
                reference=str(order.id),
            )

            self.reserve_ad(order_item.ad.id, self.user)

        admin_user = self._get_admin_user()
        admin_wallet = WalletService(admin_user)
        admin_wallet.credit(
            amount=total_fee,
            description=f"کارمزد سفارش #{order.order_number} ({fee_percent}%)",
            reference=str(order.id),
        )

        order.status = Order.Status.PAID
        order.paid_at = timezone.now()
        order.save()

        return {
            "total": order.final_price,
            "fee": total_fee,
            "seller_total": seller_total,
            "fee_percent": fee_percent,
        }

    def _get_admin_user(self):
        from apps.users.models import User

        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            admin = User.objects.create_superuser(
                mobile="09123456789", password="admin123"
            )
        return admin

    def get_user_orders(self, status=None):
        queryset = Order.objects.filter(user=self.user)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get_order_detail(self, order_id):
        return Order.objects.get(id=order_id, user=self.user)

    def cancel_order(self, order_id):
        order = Order.objects.get(id=order_id, user=self.user)

        if order.status not in [Order.Status.PENDING, Order.Status.PAID]:
            raise APIException("این سفارش قابل لغو نیست")

        if order.status == Order.Status.PAID:
            fee_percent = 10
            total_fee = int(order.final_price * fee_percent / 100)

            wallet_service = WalletService(self.user)
            wallet_service.credit(
                amount=order.final_price,
                description=f"برگشت وجه سفارش #{order.order_number}",
                reference=str(order.id),
            )

            for order_item in order.order_items.all():
                order_item.ad.quantity += order_item.quantity
                order_item.ad.save()
                order_item.ad.status = Ad.Status.APPROVED
                order_item.ad.buyer = None
                order_item.ad.reserved_until = None
                order_item.ad.save()

            admin_user = self._get_admin_user()
            admin_wallet = WalletService(admin_user)

            for order_item in order.order_items.all():
                seller = order_item.ad.user
                item_total = order_item.price_at_time * order_item.quantity
                item_fee = int(item_total * fee_percent / 100)
                item_seller_amount = item_total - item_fee

                seller_wallet = WalletService(seller)
                if seller_wallet.get_balance() >= item_seller_amount:
                    seller_wallet.debit(
                        amount=item_seller_amount,
                        description=f"برگشت وجه فروش {order_item.ad.title} - سفارش #{order.order_number}",
                        reference=str(order.id),
                    )

            if admin_wallet.get_balance() >= total_fee:
                admin_wallet.debit(
                    amount=total_fee,
                    description=f"برگشت کارمزد سفارش #{order.order_number}",
                    reference=str(order.id),
                )

        order.status = Order.Status.CANCELLED
        order.save()
        return order

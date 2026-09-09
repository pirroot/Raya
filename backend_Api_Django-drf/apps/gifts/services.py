# services.py - ایجاد فایل جدید
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Gift, GiftUsage


class GiftService:
    @staticmethod
    def validate_gift(code: str, user, total_amount: int = 0, order_type: str = None):
        try:
            gift = Gift.objects.get(code=code, is_active=True)
        except Gift.DoesNotExist:
            return {"valid": False, "message": "کد تخفیف نامعتبر است"}
        if gift.expires_at and gift.expires_at < timezone.now():
            return {"valid": False, "message": "کد تخفیف منقضی شده است"}

        if gift.users.exists() and user not in gift.users.all():
            return {
                "valid": False,
                "message": "این کد تخفیف برای شما قابل استفاده نیست",
            }

        if gift.max_uses_per_user > 0:
            user_uses = GiftUsage.objects.filter(user=user, gift=gift).count()
            if user_uses >= gift.max_uses_per_user:
                return {"valid": False, "message": "شما از سقف مجاز استفاده کرده‌اید"}

        if gift.max_uses_total > 0 and gift.usages.count() >= gift.max_uses_total:
            return {"valid": False, "message": "سقف استفاده از این کد تکمیل شده است"}

        if (
            order_type
            and gift.applies_to != Gift.AppliesTo.ALL
            and gift.applies_to != order_type
        ):
            return {
                "valid": False,
                "message": f"این کد تخفیف برای {gift.get_applies_to_display()} قابل استفاده است",
            }

        discount = gift.calculate_discount(total_amount) if total_amount > 0 else 0

        return {
            "valid": True,
            "message": "کد تخفیف معتبر است",
            "gift": gift,
            "discount": discount,
            "final_amount": total_amount - discount if total_amount > 0 else 0,
            "discount_type": gift.discount_type,
            "discount_value": gift.discount_value,
        }

    @staticmethod
    def apply_gift(code: str, user, order_id: str, order_type: str, total_amount: int):
        """اعمال کد تخفیف روی سفارش"""
        validation_result = GiftService.validate_gift(
            code, user, total_amount, order_type
        )

        if not validation_result["valid"]:
            raise ValidationError(validation_result["message"])

        gift = validation_result["gift"]
        discount = validation_result["discount"]

        if discount == 0:
            raise ValidationError("مبلغ تخفیف صفر است")

        usage = GiftUsage.objects.create(
            user=user,
            gift=gift,
            order_id=order_id,
            order_type=order_type,
            discounted_amount=discount,
        )

        return {
            "success": True,
            "message": "کد تخفیف با موفقیت اعمال شد",
            "discount": discount,
            "final_amount": total_amount - discount,
            "usage": usage,
        }

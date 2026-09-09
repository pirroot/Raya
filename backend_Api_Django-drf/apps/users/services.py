# apps/users/services.py
import random
import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from apps.users.models import User, OTPRequest

logger = logging.getLogger(__name__)


class InvalidOTPException(Exception):
    pass


class OTPService:
    """سرویس مدیریت کدهای تایید"""

    @staticmethod
    def request_otp(mobile: str, purpose: str = "login") -> tuple:
        """درخواست کد تایید"""
        code = OTPService._generate_code()
        expires_at = timezone.now() + timedelta(seconds=settings.OTP_TTL_SECONDS)

        otp = OTPRequest.objects.create(
            mobile=mobile,
            code_hash=make_password(code),
            purpose=purpose,
            expires_at=expires_at,
        )

        # ارسال پیامک
        if settings.DEBUG:
            logger.info(f"🔐 OTP code for {mobile}: {code}")
            print(f"\n📱 کد تایید: {code}\n")
        else:
            # ارسال واقعی از طریق SMS.ir
            from .sms_service import SMSService

            result = SMSService.send_verify_code(mobile, code)

            if not result["success"]:
                otp.delete()
                raise ValueError(f"خطا در ارسال پیامک: {result.get('message')}")

        return otp, code

    @staticmethod
    def verify_otp(mobile: str, code: str, purpose: str = "login") -> tuple:
        """تایید کد تایید"""
        otp = (
            OTPRequest.objects.filter(
                mobile=mobile,
                purpose=purpose,
                is_used=False,
                expires_at__gte=timezone.now(),
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            raise InvalidOTPException("کد تایید نامعتبر یا منقضی شده است")

        if otp.attempts >= 10:
            raise InvalidOTPException("تعداد تلاش‌های مجاز به پایان رسیده است")

        if not check_password(code, otp.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            raise InvalidOTPException("کد تایید اشتباه است")

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        user, created = User.objects.get_or_create(
            mobile=mobile, defaults={"mobile_verified": True}
        )

        if not user.mobile_verified:
            user.mobile_verified = True
            user.save(update_fields=["mobile_verified"])

        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at"])

        return user, created

    @staticmethod
    def _generate_code() -> str:
        return "".join(str(random.randint(0, 9)) for _ in range(6))


class TokenService:
    """سرویس مدیریت توکن‌های JWT"""

    @staticmethod
    def issue_tokens(user) -> dict:
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

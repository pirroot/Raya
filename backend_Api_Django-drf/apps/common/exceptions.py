import logging

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import status
from rest_framework.exceptions import APIException as DRFAPIException

logger = logging.getLogger("apps.common")


# ===== کلاس APIException برای استفاده در سرویس‌ها =====
class APIException(DRFAPIException):
    """کلاس پایه برای خطاهای API - سازگار با DRF"""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "خطا در درخواست"
    default_code = "error"

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail, code)


class NotFoundError(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "موردی یافت نشد"
    default_code = "not_found"


class PermissionDeniedError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "شما دسترسی لازم را ندارید"
    default_code = "permission_denied"


class ValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "داده‌های ارسال شده نامعتبر است"
    default_code = "validation_error"


class AuthenticationError(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "لطفاً وارد شوید"
    default_code = "authentication_error"


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "درخواست با وضعیت فعلی تداخل دارد"
    default_code = "conflict"


class PaymentRequiredError(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "موجودی کافی نیست"
    default_code = "payment_required"


class ServerError(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "خطای داخلی سرور"
    default_code = "server_error"


# ===== کلاس‌های موجود قبلی =====
class ServiceException(Exception):
    """Base exception for business/service layer errors."""

    default_message = "خطایی رخ داده است."
    code = "service_error"

    def __init__(self, message: str | None = None, code: str | None = None):
        self.message = message or self.default_message
        self.code = code or self.code
        super().__init__(self.message)


class NotFoundServiceException(ServiceException):
    default_message = "مورد درخواستی یافت نشد."
    code = "not_found"


class PermissionDeniedServiceException(ServiceException):
    default_message = "شما اجازه دسترسی به این بخش را ندارید."
    code = "permission_denied"


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to return a consistent
    error envelope: {"error": {"code": ..., "message": ..., "details": ...}}
    """
    response = drf_exception_handler(exc, context)

    if isinstance(exc, ServiceException):
        from rest_framework.response import Response

        return Response(
            {"error": {"code": exc.code, "message": exc.message}},
            status=400,
        )

    if response is not None:
        logger.warning("API error: %s", exc, exc_info=True)
        response.data = {
            "error": {
                "code": getattr(exc, "default_code", "error"),
                "message": str(exc),
                "details": response.data,
            }
        }
        return response

    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return None

# apps/users/sms_service.py
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class SMSService:
    """سرویس ارسال پیامک با SMS.ir"""

    BASE_URL = "https://api.sms.ir/v1"

    @classmethod
    def _get_headers(cls):
        return {
            "X-API-KEY": settings.SMS_IR_API_KEY,
            "Content-Type": "application/json",
            "Accept": "text/plain",
        }

    @classmethod
    def send_verify_code(cls, mobile: str, code: str, template_id=None):
        try:
            mobile = cls._clean_mobile(mobile)
            template_id = template_id or settings.SMS_IR_OTP_TEMPLATE_ID

            if not template_id:
                return {"success": False, "message": "قالب پیامک تنظیم نشده است"}

            response = requests.post(
                f"{cls.BASE_URL}/send/verify",
                headers=cls._get_headers(),
                json={
                    "mobile": mobile,
                    "templateId": int(template_id),
                    "parameters": [{"name": "CODE", "value": str(code)}],
                },
                timeout=10,
            )

            result = response.json()

            if response.status_code == 200 and result.get("status") == 1:
                return {"success": True, "message": "پیامک با موفقیت ارسال شد"}
            else:
                return {
                    "success": False,
                    "message": result.get("message", "خطا در ارسال پیامک"),
                }

        except Exception as e:
            logger.error(f"SMS.ir error: {str(e)}")
            return {"success": False, "message": "خطا در ارسال پیامک"}

    @staticmethod
    def _clean_mobile(mobile: str) -> str:
        mobile = "".join(filter(str.isdigit, mobile))
        if mobile.startswith("0"):
            mobile = mobile[1:]
        if mobile.startswith("98"):
            mobile = mobile[2:]
        return mobile

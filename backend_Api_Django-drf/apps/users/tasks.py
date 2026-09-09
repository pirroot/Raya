import logging

from celery import shared_task

logger = logging.getLogger("apps.users")


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def send_otp_sms(self, mobile: str, code: str):
    """
    Sends the OTP code via the SMS provider.
    TODO: integrate real SMS provider (e.g. Kavenegar / Farapayamak).
    """
    logger.info("Sending OTP %s to %s", code, mobile)

    # For development, log the code and return success
    # Production: implement actual SMS provider
    # Example with Kavenegar:
    # import requests
    # api_key = settings.SMS_PROVIDER_API_KEY
    # url = f"https://api.kavenegar.com/v1/{api_key}/verify/lookup.json"
    # payload = {"receptor": mobile, "token": code, "template": "verify"}
    # response = requests.post(url, data=payload)
    # response.raise_for_status()

    return {"mobile": mobile, "code": code, "status": "sent"}

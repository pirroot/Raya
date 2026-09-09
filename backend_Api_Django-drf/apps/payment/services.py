import requests
import json
from django.conf import settings


class ZarinpalService:
    def __init__(self):
        self.merchant_id = settings.ZARINPAL_MERCHANT_ID
        self.sandbox = settings.ZARINPAL_SANDBOX
        self.request_url = settings.ZARINPAL_REQUEST_URL
        self.verify_url = settings.ZARINPAL_VERIFY_URL
        self.startpay_url = settings.ZARINPAL_STARTPAY_URL
        self.callback_url = settings.ZARINPAL_CALLBACK_URL

    def request_payment(
        self, amount: int, description: str, mobile: str = "", email: str = ""
    ) -> dict:
        data = {
            "merchant_id": self.merchant_id,
            "amount": amount,
            "callback_url": self.callback_url,
            "description": description,
            "metadata": {},
        }

        if mobile:
            data["metadata"]["mobile"] = mobile
        if email:
            data["metadata"]["email"] = email

        headers = {"Content-Type": "application/json", "Accept": "application/json"}

        try:
            response = requests.post(
                self.request_url, data=json.dumps(data), headers=headers, timeout=30
            )
            result = response.json()

            if result.get("data", {}).get("code") == 100:
                return {
                    "success": True,
                    "authority": result["data"]["authority"],
                    "payment_url": f"{self.startpay_url}{result['data']['authority']}",
                    "code": result["data"]["code"],
                }
            else:
                return {
                    "success": False,
                    "message": result.get("errors", {}).get(
                        "message", "خطا در ارتباط با زرین‌پال"
                    ),
                    "code": result.get("data", {}).get("code"),
                }
        except Exception as e:
            return {"success": False, "message": str(e)}

    def verify_payment(self, authority: str, amount: int) -> dict:
        data = {
            "merchant_id": self.merchant_id,
            "amount": amount,
            "authority": authority,
        }

        headers = {"Content-Type": "application/json", "Accept": "application/json"}

        try:
            response = requests.post(
                self.verify_url, data=json.dumps(data), headers=headers, timeout=30
            )
            result = response.json()

            code = result.get("data", {}).get("code")

            if code == 100:
                return {
                    "success": True,
                    "ref_id": result["data"]["ref_id"],
                    "card_pan": result["data"].get("card_pan"),
                    "card_hash": result["data"].get("card_hash"),
                    "code": code,
                }
            elif code == 101:
                return {
                    "success": True,
                    "ref_id": result["data"].get("ref_id"),
                    "message": "تراکنش قبلاً تایید شده است",
                    "code": code,
                }
            else:
                return {
                    "success": False,
                    "message": result.get("errors", {}).get(
                        "message", "خطا در تایید پرداخت"
                    ),
                    "code": code,
                }
        except Exception as e:
            return {"success": False, "message": str(e)}

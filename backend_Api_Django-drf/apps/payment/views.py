from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from .services import ZarinpalService
from .models import Payment
from apps.wallet.services import WalletService


class PaymentRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")
        description = request.data.get("description", "شارژ کیف پول")
        mobile = request.user.mobile
        email = request.user.email

        if not amount or amount <= 0:
            return Response(
                {"error": "مبلغ نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST
            )

        service = ZarinpalService()
        result = service.request_payment(amount, description, mobile, email)

        if result["success"]:
            payment = Payment.objects.create(
                user=request.user,
                amount=amount,
                authority=result["authority"],
                description=description,
                status=Payment.Status.PENDING,
            )

            return Response(
                {
                    "success": True,
                    "authority": result["authority"],
                    "payment_url": result["payment_url"],
                    "payment_id": str(payment.id),
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "error": result.get("message", "خطا در ایجاد پرداخت"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class PaymentVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        authority = request.query_params.get("Authority")
        status_param = request.query_params.get("Status")

        if not authority:
            return Response(
                {"error": "Authority not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        if status_param != "OK":
            return Response(
                {"success": False, "error": "پرداخت ناموفق یا لغو شده"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = Payment.objects.get(
                authority=authority, status=Payment.Status.PENDING
            )
        except Payment.DoesNotExist:
            return Response(
                {"success": False, "error": "پرداخت یافت نشد"},
                status=status.HTTP_404_NOT_FOUND,
            )

        service = ZarinpalService()
        result = service.verify_payment(authority, payment.amount)

        if result["success"]:
            with transaction.atomic():
                payment.status = Payment.Status.PAID
                payment.ref_id = str(result["ref_id"])
                payment.card_pan = result.get("card_pan", "")
                payment.card_hash = result.get("card_hash", "")
                payment.verified_at = timezone.now()
                payment.save()

                wallet_service = WalletService(payment.user)
                wallet_service.deposit(
                    amount=payment.amount,
                    description=f"شارژ کیف پول - ref: {result['ref_id']}",
                    gateway_ref=str(result["ref_id"]),
                )

            return Response(
                {
                    "success": True,
                    "ref_id": result["ref_id"],
                    "amount": payment.amount,
                    "message": "پرداخت با موفقیت انجام شد",
                },
                status=status.HTTP_200_OK,
            )
        else:
            payment.status = Payment.Status.FAILED
            payment.save()

            return Response(
                {
                    "success": False,
                    "error": result.get("message", "خطا در تایید پرداخت"),
                    "code": result.get("code"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

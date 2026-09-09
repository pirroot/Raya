from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.paginator import Paginator
import uuid

from .models import WalletTransaction
from .serializers import WalletBalanceSerializer, WalletTransactionSerializer
from .services import WalletService


class WalletBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        balance = WalletService(user=request.user).get_balance()
        return Response({"balance": balance})


class WalletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    def list(self, request, *args, **kwargs):
        """سفارشی کردن خروجی برای فرانت‌اند"""
        queryset = self.get_queryset()

        # Pagination
        page = int(request.query_params.get("page", 1))
        limit = int(request.query_params.get("limit", 20))

        paginator = Paginator(queryset, limit)
        page_obj = paginator.get_page(page)

        serializer = self.get_serializer(page_obj, many=True)

        return Response(
            {
                "items": serializer.data,
                "page": page_obj.number,
                "totalPages": paginator.num_pages,
                "totalItems": paginator.count,
                "hasNext": page_obj.has_next(),
                "hasPrev": page_obj.has_previous(),
            }
        )


class TestTopupView(APIView):
    """POST /api/v1/user/wallet/test-topup/ - برای تست (بدون درگاه)"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount", 10000)

        if amount <= 0:
            return Response(
                {"error": "مبلغ باید بزرگتر از صفر باشد"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet_service = WalletService(user=request.user)
        balance = wallet_service.deposit(
            amount=amount,
            description=f"شارژ تستی - {amount} تومان",
            gateway_ref="test_gateway",
        )

        return Response(
            {
                "success": True,
                "message": f"کیف پول با موفقیت به مبلغ {amount} تومان شارژ شد.",
                "balance": balance,
            },
            status=status.HTTP_200_OK,
        )


class TopupView(APIView):
    """POST /api/v1/user/wallet/topup/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")
        description = request.data.get("description", "شارژ کیف پول")

        if not amount or amount <= 0:
            return Response(
                {"error": "مبلغ معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST
            )

        wallet_service = WalletService(user=request.user)
        balance = wallet_service.deposit(
            amount=amount, description=description, gateway_ref="simulated_gateway"
        )

        return Response(
            {
                "success": True,
                "message": f"کیف پول به مبلغ {amount} تومان شارژ شد.",
                "balance": balance,
                "paymentUrl": "/panel/wallet/callback?status=success",
            }
        )


class PaymentRequestView(APIView):
    """POST /api/v1/wallet/payment/request/ - درخواست پرداخت"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")
        description = request.data.get("description", "شارژ کیف پول")

        if not amount or int(amount) <= 0:
            return Response(
                {"error": "مبلغ معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST
            )

        amount = int(amount)

        # ایجاد تراکنش موقت
        transaction = WalletTransaction.objects.create(
            user=request.user,
            amount=amount,
            type=WalletTransaction.Type.DEPOSIT,
            status=WalletTransaction.Status.PENDING,
            description=description,
            reference=f"PAY-{uuid.uuid4().hex[:8].upper()}",
        )

        payment_url = f"/panel/wallet/callback?status=success&amount={amount}&ref={transaction.reference}"

        return Response(
            {
                "success": True,
                "authority": transaction.reference,
                "payment_url": payment_url,
                "payment_id": str(transaction.id),
            }
        )


class PaymentVerifyView(APIView):
    """POST /api/v1/wallet/payment/verify/ - تایید پرداخت"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        authority = request.data.get("authority")
        status_param = request.data.get("status")

        if status_param != "success":
            return Response(
                {"success": False, "message": "پرداخت ناموفق بود"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transaction = WalletTransaction.objects.get(
                user=request.user,
                reference=authority,
                status=WalletTransaction.Status.PENDING,
            )
        except WalletTransaction.DoesNotExist:
            return Response(
                {"success": False, "message": "تراکنش یافت نشد"},
                status=status.HTTP_404_NOT_FOUND,
            )

        wallet_service = WalletService(user=request.user)
        balance = wallet_service.deposit(
            amount=transaction.amount,
            description=transaction.description,
            gateway_ref=authority,
        )

        transaction.status = WalletTransaction.Status.SUCCESS
        transaction.balance_after = balance
        transaction.save()

        return Response(
            {
                "success": True,
                "ref_id": authority,
                "amount": transaction.amount,
                "message": "پرداخت با موفقیت تایید شد",
            }
        )


class ConvertCoinsToWalletView(APIView):
    """POST /api/v1/wallet/convert/ - تبدیل سکه به تومان"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")

        if not amount or int(amount) <= 0:
            return Response(
                {"error": "مبلغ معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "success": True,
                "balance": 10000,
                "coins": 50,
                "message": f"{amount} سکه با موفقیت تبدیل شد",
            }
        )


class RepairWalletView(APIView):
    """POST /api/v1/user/wallet/repair/ - تعمیر تراکنش‌ها (فقط ادمین)"""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        user_id = request.data.get("user_id")

        if user_id:
            # تعمیر یک کاربر خاص
            from apps.users.models import User

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "کاربر یافت نشد"}, status=status.HTTP_404_NOT_FOUND
                )

            service = WalletService(user)
            result = service.repair_all_transactions()

            return Response({"success": True, "user": user.mobile, "result": result})

        else:
            # تعمیر همه کاربران
            from apps.users.models import User

            results = []

            for user in User.objects.all():
                service = WalletService(user)
                result = service.repair_all_transactions()
                results.append(
                    {
                        "user": user.mobile,
                        "balance": result["balance"],
                        "transactions": result["transactions_fixed"],
                    }
                )

            return Response(
                {"success": True, "users_fixed": len(results), "results": results}
            )

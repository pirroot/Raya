# apps/coins/views.py
from rest_framework import permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .models import CoinPackage, CoinTransaction
from .serializers import (
    CoinBalanceSerializer,
    CoinPackageSerializer,
    CoinTransactionSerializer,
)
from .services import CoinService


class CoinPackageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CoinPackage.objects.filter(is_active=True)
    serializer_class = CoinPackageSerializer
    permission_classes = [permissions.AllowAny]


class CoinBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        balance = CoinService(user=request.user).get_balance()
        return Response(CoinBalanceSerializer({"balance": balance}).data)


class CoinTransactionListView(viewsets.ReadOnlyModelViewSet):
    serializer_class = CoinTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CoinTransaction.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )


class CoinPurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount")

        if not amount:
            return Response(
                {"error": "تعداد سکه الزامی است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = int(amount)
        except ValueError:
            return Response(
                {"error": "تعداد سکه باید عدد باشد"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {"error": "تعداد سکه باید بیشتر از صفر باشد"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # محاسبه قیمت (هر سکه = ۱۰۰۰ تومان)
        rate = getattr(settings, "COIN_RATE", 1000)
        price = amount * rate

        # سرویس کیف پول
        from apps.wallet.services import WalletService

        wallet_service = WalletService(request.user)

        if wallet_service.get_balance() < price:
            return Response(
                {"error": f"موجودی کیف پول کافی نیست. نیاز: {price} تومان"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # کسر از کیف پول
        wallet_service.withdraw(amount=price, description=f"خرید {amount} سکه")

        # اضافه کردن سکه
        coin_service = CoinService(request.user)
        coin_service.credit(
            amount=amount,
            reason=CoinTransaction.Reason.PURCHASE,
        )

        return Response(
            {
                "success": True,
                "coins": amount,
                "balance": coin_service.get_balance(),
                "wallet_balance": wallet_service.get_balance(),
                "price": price,
            }
        )


class CoinConvertView(APIView):
    """POST /api/v1/user/coins/convert/ - تبدیل پول کیف پول به سکه"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount_toman = request.data.get("amount")
        if not amount_toman:
            return Response(
                {"error": "مبلغ به تومان الزامی است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount_toman = int(amount_toman)
        except ValueError:
            return Response(
                {"error": "مبلغ باید عدد باشد"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = CoinService(user=request.user).convert_wallet_to_coins(
                amount_toman
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

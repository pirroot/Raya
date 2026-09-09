from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TopupView,
    WalletBalanceView,
    WalletTransactionViewSet,
    TestTopupView,
    PaymentRequestView,
    PaymentVerifyView,
    ConvertCoinsToWalletView,
    RepairWalletView,  # ✅ این رو اضافه کن
)

router = DefaultRouter()
router.register(
    r"transactions", WalletTransactionViewSet, basename="wallet-transactions"
)

urlpatterns = [
    path("", WalletBalanceView.as_view(), name="wallet-balance"),
    path("test-topup/", TestTopupView.as_view(), name="test-topup"),
    path("topup/", TopupView.as_view(), name="topup"),
    path("payment/request/", PaymentRequestView.as_view(), name="payment-request"),
    path("payment/verify/", PaymentVerifyView.as_view(), name="payment-verify"),
    path("convert/", ConvertCoinsToWalletView.as_view(), name="convert-coins"),
    path("repair/", RepairWalletView.as_view(), name="repair-wallet"),
    path("", include(router.urls)),
]

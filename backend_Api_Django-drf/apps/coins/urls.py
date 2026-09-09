# apps/coins/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CoinBalanceView,
    CoinPackageViewSet,
    CoinTransactionListView,
    CoinPurchaseView,
    CoinConvertView,
)

app_name = "coins"

router = DefaultRouter()
router.register("packages", CoinPackageViewSet, basename="coin-package")
router.register("transactions", CoinTransactionListView, basename="coin-transaction")

urlpatterns = [
    path("", include(router.urls)),
    path("balance/", CoinBalanceView.as_view(), name="coin-balance"),
    path("purchase/", CoinPurchaseView.as_view(), name="coin-purchase"),
    path("convert/", CoinConvertView.as_view(), name="coin-convert"),
]

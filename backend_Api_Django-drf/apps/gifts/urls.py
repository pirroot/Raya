from django.urls import path
from .views import (
    GiftListView,
    GiftRedeemView,
    MyGiftsView,
    GiftValidateView,
    GiftApplyView,
)

app_name = "gifts"

urlpatterns = [
    path("gifts/", GiftListView.as_view(), name="gift-list"),
    path("gifts/redeem/", GiftRedeemView.as_view(), name="gift-redeem"),
    path("gifts/my/", MyGiftsView.as_view(), name="my-gifts"),
    path("gifts/validate/", GiftValidateView.as_view(), name="gift-validate"),
    path("gifts/apply/", GiftApplyView.as_view(), name="gift-apply"),
]

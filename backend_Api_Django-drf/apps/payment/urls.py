from django.urls import path
from .views import PaymentRequestView, PaymentVerifyView

app_name = "payment"

urlpatterns = [
    path("payment/request/", PaymentRequestView.as_view(), name="payment-request"),
    path("payment/verify/", PaymentVerifyView.as_view(), name="payment-verify"),
]

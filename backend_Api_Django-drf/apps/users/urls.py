from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AvatarUploadView,
    CSRFTokenView,
    MeView,
    OTPRequestView,
    OTPVerifyView,
    ProfileView,
    LogoutView,
)

app_name = "users"

urlpatterns = [
    path("auth/csrf/", CSRFTokenView.as_view(), name="csrf"),
    path("auth/send-otp/", OTPRequestView.as_view(), name="send-otp"),
    path("auth/verify-otp/", OTPVerifyView.as_view(), name="verify-otp"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("user/me/", MeView.as_view(), name="me"),
    path("user/profile/", ProfileView.as_view(), name="profile"),
    path("user/avatar/", AvatarUploadView.as_view(), name="avatar-upload"),
]

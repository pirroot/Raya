# apps/users/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.conf import settings
from apps.storage.models import MediaFile

from .serializers import (
    AvatarUploadSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .services import OTPService, TokenService, InvalidOTPException


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "otp_request"

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            otp, code = OTPService().request_otp(**serializer.validated_data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {"detail": "کد تایید ارسال شد."}

        if settings.DEBUG:
            response_data["otp_code"] = code

        response = Response(response_data, status=status.HTTP_200_OK)
        response.set_cookie(
            "otp_challenge_token",
            str(otp.id),
            httponly=True,
            samesite="Lax",
            max_age=settings.OTP_TTL_SECONDS,
            path="/",
        )

        return response


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "otp_verify"

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, created = OTPService().verify_otp(
                mobile=serializer.validated_data["mobile"],
                code=serializer.validated_data["code"],
                purpose=serializer.validated_data["purpose"],
            )
        except InvalidOTPException as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        tokens = TokenService().issue_tokens(user)

        response = Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
                "requires_registration": created,
                "is_new_user": created,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            "access_token",
            tokens["access"],
            httponly=False,
            samesite="Lax",
            max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds(),
            path="/",
        )

        response.set_cookie(
            "refresh_token",
            tokens["refresh"],
            httponly=True,
            samesite="Lax",
            max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds(),
            path="/",
        )

        response.delete_cookie("otp_challenge_token", path="/")

        if created:
            response.set_cookie(
                "registration_token",
                tokens["access"],
                httponly=True,
                samesite="Lax",
                max_age=3600,
                path="/",
            )
            response.set_cookie(
                "registration_step",
                "profile",
                httponly=True,
                samesite="Lax",
                max_age=3600,
                path="/",
            )

        return response


class MeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        return UserSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "GET":
            return UserSerializer
        return UserUpdateSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)

        if request.user.first_name and request.user.last_name:
            response.delete_cookie("registration_token", path="/")
            response.delete_cookie("registration_step", path="/")

        return response


class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = get_token(request)
        response = JsonResponse({"csrf_token": token})
        response.set_cookie(
            "csrftoken",
            token,
            httponly=False,
            samesite="Lax",
            secure=False,
        )
        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response(
            {"detail": "خروج با موفقیت انجام شد."}, status=status.HTTP_200_OK
        )

        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        response.delete_cookie("otp_challenge_token", path="/")
        response.delete_cookie("registration_token", path="/")
        response.delete_cookie("registration_step", path="/")

        return response


class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        avatar = serializer.validated_data["avatar"]
        user = request.user

        media_file = MediaFile.objects.create(
            file=avatar,
            file_name=avatar.name,
            file_size=avatar.size,
            mime_type=avatar.content_type,
            file_type="image",
            uploaded_by=user,
        )

        if user.avatar:
            user.avatar.delete()

        user.avatar = media_file
        user.save(update_fields=["avatar"])

        return Response(
            {
                "detail": "آواتار با موفقیت آپلود شد.",
                "avatar_url": media_file.cdn_url or media_file.file.url,
            },
            status=status.HTTP_200_OK,
        )

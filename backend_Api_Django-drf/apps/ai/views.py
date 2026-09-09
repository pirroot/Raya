import base64
import logging
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.base import ContentFile

from apps.common.exceptions import ServiceException
from apps.coins.services import CoinService
from apps.coins.models import CoinTransaction
from apps.storage.models import MediaFile

from .models import AiSession, AiMessage, AiFile, AiUsage
from .serializers import (
    AiSessionSerializer,
    AiMessageSerializer,
    AiFileSerializer,
    AiUsageSerializer,
    SendMessageSerializer,
)
from .services import GapGPTService

logger = logging.getLogger(__name__)


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = AiSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AiSession.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        content = (request.data.get("content") or "").strip()

        session = AiSession.objects.create(
            user=request.user,
            title=content[:50] if content else "گفتگوی جدید",
            settings={
                "customPrompt": "",
                "model": "gpt-4o",
                "temperature": 0.7,
            },
        )

        if not content:
            return Response(
                AiSessionSerializer(session).data,
                status=status.HTTP_201_CREATED,
            )

        user_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.USER,
            content=content,
            status=AiMessage.Status.COMPLETED,
        )

        ai_service = GapGPTService()
        response = ai_service.chat(content, session.settings)

        assistant_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.ASSISTANT,
            content=response,
            status=AiMessage.Status.COMPLETED,
        )

        usage, _ = AiUsage.objects.get_or_create(user=request.user)
        if usage.used_free_messages < usage.daily_free_limit:
            usage.used_free_messages += 1
            usage.save()

        return Response(
            {
                "session": {
                    "id": str(session.id),
                    "title": session.title,
                    "settings": session.settings,
                    "created_at": session.created_at.isoformat(),
                    "updated_at": session.updated_at.isoformat(),
                },
                "userMessage": {
                    "id": str(user_message.id),
                    "role": user_message.role,
                    "content": user_message.content,
                    "status": user_message.status,
                    "created_at": user_message.created_at.isoformat(),
                },
                "assistantMessage": {
                    "id": str(assistant_message.id),
                    "role": assistant_message.role,
                    "content": assistant_message.content,
                    "status": assistant_message.status,
                    "created_at": assistant_message.created_at.isoformat(),
                },
                "usage": {
                    "dailyFreeLimit": usage.daily_free_limit,
                    "usedFreeMessages": usage.used_free_messages,
                    "remainingFreeMessages": max(
                        0, usage.daily_free_limit - usage.used_free_messages
                    ),
                    "paidMessages": usage.paid_messages,
                    "coinCostPerMessage": usage.coin_cost_per_message,
                    "freeMessagesWindowEndsAt": (
                        usage.free_window_ends_at.isoformat()
                        if usage.free_window_ends_at
                        else None
                    ),
                },
                "balance": {
                    "balance": CoinService(request.user).get_balance(),
                    "ratePerCoin": 1000,
                    "currency": "IRR",
                },
                "billing": {
                    "usedCoins": 0,
                    "charged": False,
                    "refunded": False,
                    "mode": "daily-free",
                },
            },
            status=status.HTTP_201_CREATED,
        )


class AiBootstrapView(APIView):
    """GET /api/v1/ai/bootstrap/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        usage, created = AiUsage.objects.get_or_create(
            user=user,
            defaults={
                "daily_free_limit": 5,
                "used_free_messages": 0,
                "paid_messages": 0,
                "coin_cost_per_message": 1,
                "free_window_ends_at": timezone.now() + timezone.timedelta(days=1),
            },
        )

        remaining = max(0, usage.daily_free_limit - usage.used_free_messages)

        sessions = AiSession.objects.filter(user=user).order_by("-created_at")

        data = {
            "user": {
                "firstName": user.first_name or "کاربر",
                "username": user.username or user.mobile,
                "avatarUrl": None,
            },
            "balance": {
                "balance": CoinService(user).get_balance(),
                "rate_per_coin": 1000,
                "currency": "IRR",
            },
            "usage": {
                "dailyFreeLimit": usage.daily_free_limit,
                "usedFreeMessages": usage.used_free_messages,
                "remainingFreeMessages": remaining,
                "coinCostPerMessage": usage.coin_cost_per_message,
                "paidMessages": usage.paid_messages,
                "freeMessagesWindowEndsAt": (
                    usage.free_window_ends_at.isoformat()
                    if usage.free_window_ends_at
                    else None
                ),
                "isFreeLimitReached": remaining <= 0,
            },
            "sessions": AiSessionSerializer(sessions, many=True).data,
        }

        return Response(data)


class SessionListView(generics.ListAPIView):
    """GET /api/v1/ai/sessions/"""

    serializer_class = AiSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AiSession.objects.filter(user=self.request_user).order_by("-created_at")


class SessionCreateView(APIView):
    """POST /api/v1/ai/sessions/"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data.get("content", "")
        file_ids = serializer.validated_data.get("file_ids", [])
        audio_data = serializer.validated_data.get("audio_data", "")
        settings = serializer.validated_data.get("settings", {})

        session = AiSession.objects.create(
            user=request.user,
            title=content[:50] if content else "گفتگوی جدید",
            settings={
                "customPrompt": "",
                "model": "gpt-4o",
                "temperature": 0.7,
            },
        )

        # ===== پردازش صدا =====
        if audio_data:
            try:
                audio_bytes = base64.b64decode(audio_data)
                audio_file = ContentFile(
                    audio_bytes, name=f"audio_{timezone.now().timestamp()}.webm"
                )
                media_file = MediaFile.objects.create(
                    file=audio_file,
                    file_name=audio_file.name,
                    file_size=audio_file.size,
                    mime_type="audio/webm",
                    file_type="audio",
                    uploaded_by=request.user,
                )
                file_ids.append(str(media_file.id))
            except Exception as e:
                logger.error(f"Audio processing error: {e}")

        user_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.USER,
            content=content or "پیام صوتی",
            status=AiMessage.Status.COMPLETED,
            file_ids=file_ids,
        )

        ai_service = GapGPTService()
        final_settings = session.settings.copy()
        final_settings.update(settings)

        response = ai_service.chat(content or "پیام صوتی", final_settings)

        assistant_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.ASSISTANT,
            content=response,
            status=AiMessage.Status.COMPLETED,
        )

        usage, _ = AiUsage.objects.get_or_create(user=request.user)
        if usage.used_free_messages < usage.daily_free_limit:
            usage.used_free_messages += 1
            usage.save()

        return Response(
            {
                "session": AiSessionSerializer(session).data,
                "user_message": AiMessageSerializer(user_message).data,
                "assistant_message": AiMessageSerializer(assistant_message).data,
                "usage": AiUsageSerializer(usage).data,
                "balance": {
                    "balance": CoinService(request.user).get_balance(),
                    "rate_per_coin": 1000,
                    "currency": "IRR",
                },
                "billing": {
                    "used_coins": 0,
                    "charged": False,
                    "refunded": False,
                    "mode": "daily-free",
                },
            },
            status=status.HTTP_201_CREATED,
        )


class SessionDeleteView(generics.DestroyAPIView):
    """DELETE /api/v1/ai/sessions/<pk>/"""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AiSession.objects.filter(user=self.request.user)


class SessionHistoryView(generics.ListAPIView):
    """GET /api/v1/ai/sessions/<pk>/history/"""

    serializer_class = AiMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        session = get_object_or_404(
            AiSession, pk=self.kwargs["pk"], user=self.request.user
        )
        return AiMessage.objects.filter(session=session).order_by("created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "items": serializer.data,
                "count": queryset.count(),
            }
        )


class SessionSettingsView(APIView):
    """PATCH /api/v1/ai/sessions/<pk>/settings/"""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        session = get_object_or_404(AiSession, pk=pk, user=request.user)
        session.settings.update(request.data)
        session.save(update_fields=["settings"])
        return Response(AiSessionSerializer(session).data)


class MessageSendView(APIView):
    """POST /api/v1/ai/sessions/<pk>/messages/"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            session = AiSession.objects.get(pk=pk, user=request.user)
        except AiSession.DoesNotExist:
            return Response(
                {"error": "گفتگو یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data.get("content", "")
        file_ids = serializer.validated_data.get("file_ids", [])
        audio_data = serializer.validated_data.get("audio_data", "")
        settings = serializer.validated_data.get("settings", {})

        usage, _ = AiUsage.objects.get_or_create(user=request.user)
        coin_service = CoinService(request.user)
        balance = coin_service.get_balance()

        # ===== پردازش صدای ضبط شده =====
        if audio_data:
            try:
                audio_bytes = base64.b64decode(audio_data)
                audio_file = ContentFile(
                    audio_bytes, name=f"audio_{timezone.now().timestamp()}.webm"
                )
                media_file = MediaFile.objects.create(
                    file=audio_file,
                    file_name=audio_file.name,
                    file_size=audio_file.size,
                    mime_type="audio/webm",
                    file_type="audio",
                    uploaded_by=request.user,
                )
                file_ids.append(str(media_file.id))
                if not content:
                    content = "پیام صوتی ارسال شد"
            except Exception as e:
                logger.error(f"Audio processing error: {e}")
                return Response(
                    {"error": "خطا در پردازش فایل صوتی"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ===== پردازش فایل‌های آپلود شده =====
        if file_ids:
            for file_id in file_ids:
                try:
                    media_file = MediaFile.objects.get(
                        id=file_id, uploaded_by=request.user
                    )
                    # میتونی اینجا محتوای فایل رو هم پردازش کنی
                    logger.info(f"File {media_file.file_name} attached to message")
                except MediaFile.DoesNotExist:
                    pass

        # ===== مدیریت محدودیت پیام‌ها =====
        if usage.used_free_messages < usage.daily_free_limit:
            usage.used_free_messages += 1
            usage.save()
            billing_mode = "daily-free"
            coins_charged = 0
        elif balance >= usage.coin_cost_per_message:
            coin_service.debit(
                usage.coin_cost_per_message,
                CoinTransaction.Reason.AI_CHAT,
            )
            usage.paid_messages += 1
            usage.save()
            billing_mode = "coins"
            coins_charged = usage.coin_cost_per_message
        else:
            return Response(
                {
                    "error": "سکه کافی نیست",
                    "code": "insufficient_coins",
                    "usage": {
                        "remainingFreeMessages": max(
                            0, usage.daily_free_limit - usage.used_free_messages
                        ),
                        "coinCostPerMessage": usage.coin_cost_per_message,
                    },
                    "balance": {"balance": coin_service.get_balance()},
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # ===== ذخیره پیام کاربر =====
        user_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.USER,
            content=content or "پیام صوتی",
            status=AiMessage.Status.COMPLETED,
            file_ids=file_ids,
        )

        # ===== دریافت پاسخ از AI =====
        ai_service = GapGPTService()
        final_settings = session.settings.copy()
        final_settings.update(settings)

        response = ai_service.chat(content or "پیام صوتی", final_settings)

        # ===== ذخیره پاسخ AI =====
        assistant_message = AiMessage.objects.create(
            session=session,
            role=AiMessage.Role.ASSISTANT,
            content=response,
            status=AiMessage.Status.COMPLETED,
            coins_charged=coins_charged,
        )

        return Response(
            {
                "session": {
                    "id": str(session.id),
                    "title": session.title,
                    "settings": session.settings,
                },
                "userMessage": {
                    "id": str(user_message.id),
                    "role": user_message.role,
                    "content": user_message.content,
                    "status": user_message.status,
                    "file_ids": user_message.file_ids,
                    "created_at": user_message.created_at.isoformat(),
                },
                "assistantMessage": {
                    "id": str(assistant_message.id),
                    "role": assistant_message.role,
                    "content": assistant_message.content,
                    "status": assistant_message.status,
                    "coins_charged": assistant_message.coins_charged,
                    "created_at": assistant_message.created_at.isoformat(),
                },
                "usage": {
                    "dailyFreeLimit": usage.daily_free_limit,
                    "usedFreeMessages": usage.used_free_messages,
                    "remainingFreeMessages": max(
                        0, usage.daily_free_limit - usage.used_free_messages
                    ),
                    "paidMessages": usage.paid_messages,
                    "coinCostPerMessage": usage.coin_cost_per_message,
                    "freeMessagesWindowEndsAt": (
                        usage.free_window_ends_at.isoformat()
                        if usage.free_window_ends_at
                        else None
                    ),
                },
                "balance": {
                    "balance": coin_service.get_balance(),
                    "ratePerCoin": 1000,
                    "currency": "IRR",
                },
                "billing": {
                    "usedCoins": coins_charged,
                    "charged": coins_charged > 0,
                    "refunded": False,
                    "mode": billing_mode,
                },
            }
        )


class FileUploadView(APIView):
    """POST /api/v1/ai/files/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "فایل ارسال نشده"}, status=status.HTTP_400_BAD_REQUEST
            )

        session_id = request.query_params.get("sessionId")
        session = None
        if session_id:
            try:
                session = AiSession.objects.get(pk=session_id, user=request.user)
            except AiSession.DoesNotExist:
                pass

        # ذخیره در MediaFile
        media_file = MediaFile.objects.create(
            file=file,
            file_name=file.name,
            file_size=file.size,
            mime_type=file.content_type or "",
            file_type="document",
            uploaded_by=request.user,
        )

        # ذخیره در AiFile برای راحتی
        ai_file = AiFile.objects.create(
            user=request.user,
            session=session,
            file=file,
            filename=file.name,
            size=file.size,
            mime_type=file.content_type or "",
        )

        return Response(
            {
                "id": str(media_file.id),
                "filename": ai_file.filename,
                "mimeType": ai_file.mime_type,
                "size": ai_file.size,
                "createdAt": ai_file.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class UsageView(APIView):
    """GET /api/v1/ai/usage/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usage, _ = AiUsage.objects.get_or_create(user=request.user)
        return Response(AiUsageSerializer(usage).data)


class BalanceView(APIView):
    """GET /api/v1/ai/balance/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        balance = CoinService(request.user).get_balance()
        return Response(
            {
                "balance": balance,
                "rate_per_coin": 1000,
                "currency": "IRR",
            }
        )

# views.py - نسخه نهایی کامل با استفاده از سرویس
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Gift, GiftUsage
from .serializers import GiftSerializer, GiftUsageSerializer, GiftValidateSerializer
from .services import GiftService


class GiftListView(generics.ListAPIView):
    """GET /api/v1/gifts/ - لیست هدایا"""

    serializer_class = GiftSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Gift.objects.filter(
            is_active=True, expires_at__gte=timezone.now()
        ).order_by("-created_at")


class GiftValidateView(APIView):
    """POST /api/v1/gifts/validate/ - اعتبارسنجی کد تخفیف"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = GiftValidateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        total_amount = serializer.validated_data.get("total_amount", 0)
        order_type = serializer.validated_data.get("order_type", Gift.AppliesTo.ALL)

        try:
            result = GiftService.validate_gift(
                code=code,
                user=request.user,
                total_amount=total_amount,
                order_type=order_type,
            )
        except Exception as e:
            return Response(
                {"valid": False, "message": "کد تخفیف نامعتبر است"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not result["valid"]:
            return Response(
                {"valid": False, "message": result["message"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "valid": True,
                "message": result["message"],
                "gift": GiftSerializer(
                    result["gift"], context={"request": request}
                ).data,
                "discount": result["discount"],
                "final_amount": result["final_amount"],
                "discount_type": result["discount_type"],
                "discount_value": result["discount_value"],
            }
        )


class GiftApplyView(APIView):
    """POST /api/v1/gifts/apply/ - اعمال کد تخفیف روی سفارش"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = GiftValidateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        total_amount = serializer.validated_data["total_amount"]
        order_type = serializer.validated_data.get("order_type", Gift.AppliesTo.ALL)
        order_id = serializer.validated_data.get("order_id", "")

        try:
            result = GiftService.apply_gift(
                code=code,
                user=request.user,
                order_id=order_id,
                order_type=order_type,
                total_amount=total_amount,
            )

            return Response(
                {
                    "success": True,
                    "message": result["message"],
                    "discount": result["discount"],
                    "final_amount": result["final_amount"],
                    "usage": GiftUsageSerializer(result["usage"]).data,
                },
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GiftRedeemView(APIView):
    """POST /api/v1/gifts/redeem/ - استفاده از هدیه با کد"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        code = request.data.get("code", "").strip().upper()

        if not code:
            return Response(
                {"error": "کد هدیه الزامی است"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            gift = Gift.objects.get(
                code=code, is_active=True, expires_at__gte=timezone.now()
            )
        except Gift.DoesNotExist:
            return Response(
                {"error": "کد هدیه نامعتبر یا منقضی شده است"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if gift.max_uses_total > 0 and gift.usages.count() >= gift.max_uses_total:
            return Response(
                {"error": "این کد هدیه به حداکثر استفاده رسیده است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if GiftUsage.objects.filter(user=request.user, gift=gift).exists():
            return Response(
                {"error": "شما قبلاً از این هدیه استفاده کرده‌اید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usage = GiftUsage.objects.create(user=request.user, gift=gift)

        return Response(GiftUsageSerializer(usage).data, status=status.HTTP_201_CREATED)


class MyGiftsView(generics.ListAPIView):
    """GET /api/v1/gifts/my/ - هدایای استفاده شده توسط کاربر"""

    serializer_class = GiftUsageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GiftUsage.objects.filter(user=self.request.user).order_by("-used_at")

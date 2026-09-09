# serializers.py - نسخه صحیح
from rest_framework import serializers
from django.utils import timezone
from .models import Gift, GiftUsage


class GiftSerializer(serializers.ModelSerializer):
    is_used_by_user = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    used_count = serializers.IntegerField(read_only=True)
    discount_type_display = serializers.CharField(
        source="get_discount_type_display", read_only=True
    )
    applies_to_display = serializers.CharField(
        source="get_applies_to_display", read_only=True
    )

    class Meta:
        model = Gift
        fields = [
            "id",
            "title",
            "description",
            "type",
            "discount_type",
            "discount_type_display",
            "discount_value",
            "code",
            "expires_at",
            "is_active",
            "is_used_by_user",
            "is_expired",
            "used_count",
            "max_uses_per_user",
            "max_uses_total",
            "applies_to",
            "applies_to_display",
            "created_at",
        ]
        read_only_fields = ["used_count", "created_at", "updated_at"]

    def get_is_used_by_user(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return GiftUsage.objects.filter(user=request.user, gift=obj).exists()
        return False

    def get_is_expired(self, obj):
        return obj.expires_at < timezone.now() if obj.expires_at else False


class GiftUsageSerializer(serializers.ModelSerializer):
    gift_title = serializers.CharField(source="gift.title", read_only=True)
    gift_code = serializers.CharField(source="gift.code", read_only=True)
    user_mobile = serializers.CharField(source="user.mobile", read_only=True)

    class Meta:
        model = GiftUsage
        fields = [
            "id",
            "user",
            "user_mobile",
            "gift",
            "gift_title",
            "gift_code",
            "order_id",
            "order_type",
            "discounted_amount",
            "used_at",
        ]
        read_only_fields = ["user", "used_at"]


class GiftValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    order_type = serializers.ChoiceField(
        choices=Gift.AppliesTo.choices, required=False, default=Gift.AppliesTo.ALL
    )
    total_amount = serializers.IntegerField(min_value=0, required=False, default=0)
    order_id = serializers.CharField(max_length=100, required=False, default="")

    def validate_code(self, value):
        try:
            gift = Gift.objects.get(code=value, is_active=True)
        except Gift.DoesNotExist:
            raise serializers.ValidationError("کد تخفیف نامعتبر است")

        if gift.expires_at and gift.expires_at < timezone.now():
            raise serializers.ValidationError("کد تخفیف منقضی شده است")

        return value

    def validate(self, data):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("کاربر احراز هویت نشده است")

        try:
            gift = Gift.objects.get(code=data["code"], is_active=True)
        except Gift.DoesNotExist:
            raise serializers.ValidationError({"code": "کد تخفیف نامعتبر است"})

        is_valid, message = gift.is_valid_for_user(request.user)
        if not is_valid:
            raise serializers.ValidationError({"code": message})

        if gift.applies_to != Gift.AppliesTo.ALL and gift.applies_to != data.get(
            "order_type"
        ):
            raise serializers.ValidationError(
                {
                    "order_type": f"این کد تخفیف برای {gift.get_applies_to_display()} قابل استفاده است"
                }
            )

        return data

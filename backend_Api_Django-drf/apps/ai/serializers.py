from rest_framework import serializers
from .models import AiSession, AiMessage, AiFile, AiUsage


class AiFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiFile
        fields = ["id", "filename", "mime_type", "size", "created_at"]


class AiMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiMessage
        fields = [
            "id",
            "session",
            "role",
            "content",
            "status",
            "input_tokens",
            "output_tokens",
            "total_tokens",
            "coins_charged",
            "file_ids",
            "created_at",
        ]
        read_only_fields = ["session", "created_at"]


class AiSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiSession
        fields = ["id", "title", "settings", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class AiUsageSerializer(serializers.Serializer):
    dailyFreeLimit = serializers.IntegerField(source="daily_free_limit")
    usedFreeMessages = serializers.IntegerField(source="used_free_messages")
    remainingFreeMessages = serializers.SerializerMethodField()
    coinCostPerMessage = serializers.IntegerField(source="coin_cost_per_message")
    paidMessages = serializers.IntegerField(source="paid_messages")
    freeMessagesWindowEndsAt = serializers.DateTimeField(
        source="free_window_ends_at", allow_null=True
    )
    isFreeLimitReached = serializers.SerializerMethodField()

    def get_remainingFreeMessages(self, obj):
        return max(0, obj.daily_free_limit - obj.used_free_messages)

    def get_isFreeLimitReached(self, obj):
        return obj.used_free_messages >= obj.daily_free_limit


class CoinBalanceSerializer(serializers.Serializer):
    balance = serializers.IntegerField()
    rate_per_coin = serializers.IntegerField(default=1000)
    currency = serializers.CharField(default="IRR")


class AiBootstrapSerializer(serializers.Serializer):
    user = serializers.DictField()
    balance = CoinBalanceSerializer()
    usage = AiUsageSerializer()
    sessions = AiSessionSerializer(many=True)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True, default="")
    file_ids = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    audio_data = serializers.CharField(required=False, allow_blank=True, default="")
    settings = serializers.DictField(required=False, default=dict)

    def validate(self, data):
        if (
            not data.get("content")
            and not data.get("file_ids")
            and not data.get("audio_data")
        ):
            raise serializers.ValidationError(
                "حداقل یکی از فیلدهای content، file_ids یا audio_data باید پر شود"
            )
        return data


class SendMessageResultSerializer(serializers.Serializer):
    session = AiSessionSerializer()
    user_message = AiMessageSerializer()
    assistant_message = AiMessageSerializer()
    usage = AiUsageSerializer()
    balance = CoinBalanceSerializer()
    billing = serializers.DictField()

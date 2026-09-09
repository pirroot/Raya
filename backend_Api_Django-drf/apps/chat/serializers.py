from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, Message
from apps.users.serializers import UserBriefSerializer

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBriefSerializer(read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(
        source="sender", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_id",
            "content",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = ["id", "is_read", "read_at", "created_at"]


class ConversationListSerializer(serializers.ModelSerializer):
    participants = UserBriefSerializer(many=True, read_only=True)
    last_message = serializers.CharField(read_only=True)
    last_message_at = serializers.DateTimeField(read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "last_message",
            "last_message_at",
            "unread_count",
        ]

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return (
                obj.messages.filter(is_read=False).exclude(sender=request.user).count()
            )
        return 0


class ConversationDetailSerializer(serializers.ModelSerializer):
    participants = UserBriefSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "participants", "messages", "last_message_at"]


class ConversationCreateSerializer(serializers.Serializer):
    participant_id = serializers.CharField()

from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source="get_type_display", read_only=True)
    priority_label = serializers.CharField(
        source="get_priority_display", read_only=True
    )
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "type_label",
            "priority",
            "priority_label",
            "title",
            "message",
            "link",
            "is_read",
            "read_at",
            "created_at",
            "time_ago",
            "metadata",
        ]
        read_only_fields = ["created_at", "read_at"]

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince

        return timesince(obj.created_at)


class NotificationListSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "type_label",
            "title",
            "message",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class MarkAllReadSerializer(serializers.Serializer):
    pass

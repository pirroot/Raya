from rest_framework import serializers
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
            "date",
            "is_pinned",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["date", "created_at"]

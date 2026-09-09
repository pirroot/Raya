from rest_framework import serializers
from .models import QA


class QASerializer(serializers.ModelSerializer):
    class Meta:
        model = QA
        fields = [
            "id",
            "question",
            "answer",
            "author",
            "likes",
            "views",
            "order",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["likes", "views", "created_at", "updated_at"]

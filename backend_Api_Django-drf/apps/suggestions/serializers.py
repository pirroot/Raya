from rest_framework import serializers
from .models import Suggestion


class SuggestionSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Suggestion
        fields = [
            "id",
            "title",
            "content",
            "author",
            "status",
            "likes",
            "is_liked",
            "created_at",
        ]
        read_only_fields = ["user", "status", "likes", "created_at"]

    def get_author(self, obj):
        return obj.user.get_full_name() or obj.user.mobile

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False

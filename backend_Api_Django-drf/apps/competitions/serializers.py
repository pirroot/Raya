from rest_framework import serializers
from .models import Competition, CompetitionRegistration


class CompetitionSerializer(serializers.ModelSerializer):
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = [
            "id",
            "title",
            "description",
            "prize",
            "deadline",
            "status",
            "participants_count",
            "is_registered",
            "created_at",
        ]
        read_only_fields = ["participants_count", "created_at"]

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return CompetitionRegistration.objects.filter(
                user=request.user, competition=obj
            ).exists()
        return False


class CompetitionRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompetitionRegistration
        fields = ["id", "user", "competition", "created_at"]
        read_only_fields = ["user", "created_at"]

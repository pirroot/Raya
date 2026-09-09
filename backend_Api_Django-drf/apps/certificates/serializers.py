from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    verify_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "user",
            "user_name",
            "course",
            "course_title",
            "code",
            "issued_at",
            "certificate_file",
            "is_verified",
            "verify_url",
        ]
        read_only_fields = ["user", "code", "issued_at", "certificate_file"]

    def get_verify_url(self, obj):
        return obj.get_verify_url()

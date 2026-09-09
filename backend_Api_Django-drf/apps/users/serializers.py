from rest_framework import serializers
from .models import User


class OTPRequestSerializer(serializers.Serializer):
    mobile = serializers.RegexField(regex=r"^09\d{9}$", max_length=15)
    purpose = serializers.ChoiceField(choices=["login", "register", "reset_password"])


class OTPVerifySerializer(serializers.Serializer):
    mobile = serializers.RegexField(regex=r"^09\d{9}$", max_length=15, required=False)
    code = serializers.CharField(max_length=10)
    purpose = serializers.ChoiceField(choices=["login", "register", "reset_password"])

    def validate(self, data):
        print("Validated data:", data)
        if not data.get("mobile"):
            print("Mobile not found!")
        return data


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "mobile",
            "mobile_verified",
            "email",
            "username",
            "first_name",
            "last_name",
            "bio",
            "avatar",
            "avatar_url",
            "birth_date",
            "student_code",
            "education_level",
            "status",
            "interests",
            "is_active",
            "is_teacher",
            "is_staff",
            "created_at",
        ]
        read_only_fields = ["id", "mobile", "mobile_verified", "created_at"]

    def get_avatar_url(self, obj):
        if obj.avatar and obj.avatar.file:
            return obj.avatar.file.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "bio",
            "birth_date",
            "student_code",
            "education_level",
            "status",
            "interests",
        ]


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

class UserBriefSerializer(serializers.ModelSerializer):
    """سریالایزر خلاصه کاربر برای نمایش در سایر اپ‌ها"""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "first_name",
            "last_name",
            "mobile",
            "avatar",
            "avatar_url",
        ]
        read_only_fields = ["id", "mobile"]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        if obj.avatar and obj.avatar.file:
            return obj.avatar.file.url
        return None

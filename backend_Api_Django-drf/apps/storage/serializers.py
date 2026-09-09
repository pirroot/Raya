from rest_framework import serializers

from .models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ["id", "file", "file_type", "original_name", "size_bytes", "mime_type", "created_at"]
        read_only_fields = ["original_name", "size_bytes", "mime_type", "created_at"]


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    file_type = serializers.ChoiceField(choices=["image", "video", "document"])

from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "mobile", "message", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

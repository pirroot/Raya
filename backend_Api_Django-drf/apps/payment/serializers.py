from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "amount",
            "authority",
            "ref_id",
            "status",
            "description",
            "created_at",
            "verified_at",
        ]
        read_only_fields = ["user", "authority", "created_at"]

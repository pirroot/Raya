from rest_framework import serializers
from .models import WalletTransaction


class WalletTransactionSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    reference = serializers.CharField(allow_blank=True)

    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "amount",
            "type",
            "status",
            "description",
            "reference",
            "gateway_ref",
            "balance_after",
            "createdAt",
        ]

    def get_type(self, obj):
        """تبدیل type های بک‌اند به فرمت فرانت‌اند"""
        mapping = {
            "deposit": "credit",
            "withdrawal": "debit",
            "payout": "credit",
            "transfer": "debit",
            "refund": "refund",
        }
        return mapping.get(obj.type, obj.type)

    def get_status(self, obj):
        """تبدیل status های بک‌اند به فرمت فرانت‌اند"""
        mapping = {
            "pending": "pending",
            "success": "committed",
            "failed": "failed",
        }
        return mapping.get(obj.status, obj.status)


class WalletBalanceSerializer(serializers.Serializer):
    balance = serializers.DecimalField(max_digits=14, decimal_places=0)

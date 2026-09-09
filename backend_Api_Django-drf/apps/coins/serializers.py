from rest_framework import serializers

from .models import CoinPackage, CoinTransaction


class CoinPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinPackage
        fields = ["id", "title", "coin_amount", "price"]


class CoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransaction
        fields = ["id", "amount", "type", "reason", "reference_id", "created_at"]


class CoinBalanceSerializer(serializers.Serializer):
    balance = serializers.IntegerField()

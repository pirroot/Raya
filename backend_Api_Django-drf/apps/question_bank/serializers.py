from rest_framework import serializers
from .models import Category, Question, QuestionDownload, QuestionLike


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "title", "slug", "icon", "is_active"]


class QuestionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True)
    user_name = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_downloaded = serializers.SerializerMethodField()
    is_purchased = serializers.SerializerMethodField()
    coin_price = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "user",
            "user_name",
            "category",
            "category_id",
            "title",
            "description",
            "teacher",
            "price_type",
            "price",
            "coin_price",
            "price_display",
            "file",
            "file_name",
            "file_size",
            "file_mime_type",
            "views",
            "downloads",
            "likes",
            "is_featured",
            "is_approved",
            "is_liked",
            "is_downloaded",
            "is_purchased",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "views",
            "downloads",
            "likes",
            "is_approved",
            "created_at",
            "updated_at",
            "file_name",
            "file_size",
            "file_mime_type",
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.mobile

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return QuestionLike.objects.filter(user=request.user, question=obj).exists()
        return False

    def get_is_downloaded(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return QuestionDownload.objects.filter(
                user=request.user, question=obj
            ).exists()
        return False

    def get_is_purchased(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.purchased_by.filter(id=request.user.id).exists()
        return False

    def get_coin_price(self, obj):
        return obj.get_coin_price()

    def get_price_display(self, obj):
        if obj.price_type == Question.PriceType.PAID:
            return f"{obj.price:,} تومان"
        return "رایگان"

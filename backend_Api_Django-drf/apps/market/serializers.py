from rest_framework import serializers
from .models import (
    Category,
    Ad,
    AdImage,
    Cart,
    CartItem,
    Order,
    OrderItem,
)
from apps.users.serializers import UserBriefSerializer


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_title = serializers.CharField(source="parent.title", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "title",
            "slug",
            "icon",
            "parent",
            "parent_title",
            "children",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(
                obj.children.filter(is_active=True), many=True
            ).data
        return []

    def validate_slug(self, value):
        if (
            Category.objects.filter(slug=value)
            .exclude(id=self.instance.id if self.instance else None)
            .exists()
        ):
            raise serializers.ValidationError("این اسلاگ قبلاً استفاده شده است")
        return value


class AdImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = AdImage
        fields = ["id", "image", "url", "is_primary", "order"]
        read_only_fields = ["id"]

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class AdSerializer(serializers.ModelSerializer):
    images = AdImageSerializer(many=True, read_only=True)
    user = UserBriefSerializer(read_only=True)
    category_title = serializers.CharField(source="category.title", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    condition_display = serializers.CharField(
        source="get_condition_display", read_only=True
    )

    class Meta:
        model = Ad
        fields = [
            "id",
            "user",
            "category",
            "category_title",
            "title",
            "description",
            "price",
            "condition",
            "condition_display",
            "status",
            "status_display",
            "campus",
            "location",
            "images",
            "views",
            "is_featured",
            "is_sold",
            "sold_at",
            "expires_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "views", "status", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user
        validated_data["status"] = Ad.Status.PENDING
        return super().create(validated_data)


class AdListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    category_title = serializers.CharField(source="category.title", read_only=True)
    images = AdImageSerializer(many=True, read_only=True)
    has_purchased = serializers.SerializerMethodField()
    seller_name = serializers.SerializerMethodField()
    seller_avatar = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()
    buyer_phone = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = [
            "id",
            "title",
            "price",
            "primary_image",
            "images",
            "description",
            "category",
            "category_title",
            "condition",
            "status",
            "views",
            "campus",
            "location",
            "buyer_name",
            "buyer_phone",
            "is_featured",
            "has_purchased",
            "is_sold",
            "seller_name",
            "seller_avatar",
            "created_at",
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url

        first = obj.images.first()
        if first:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first.image.url)
            return first.image.url

        return None

    def get_has_purchased(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            from apps.market.models import OrderItem, Order

            return OrderItem.objects.filter(
                ad=obj,
                order__user=request.user,
                order__status__in=[Order.Status.PAID, Order.Status.DELIVERED],
            ).exists()
        return False

    def get_seller_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.mobile
        return "فروشنده"

    def get_seller_avatar(self, obj):
        try:
            if obj.user and obj.user.avatar:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.user.avatar.file.url)
                return obj.user.avatar.file.url
        except Exception:
            return None
        return None

    def get_buyer_name(self, obj):
        if obj.is_sold or obj.status == Ad.Status.SOLD:
            from apps.market.models import OrderItem, Order

            order_item = OrderItem.objects.filter(
                ad=obj, order__status__in=[Order.Status.PAID, Order.Status.DELIVERED]
            ).first()
            if order_item and order_item.order:
                buyer = order_item.order.user
                return buyer.get_full_name() or buyer.mobile
        return None

    def get_buyer_phone(self, obj):
        if obj.is_sold or obj.status == Ad.Status.SOLD:
            from apps.market.models import OrderItem, Order

            order_item = OrderItem.objects.filter(
                ad=obj, order__status__in=[Order.Status.PAID, Order.Status.DELIVERED]
            ).first()
            if order_item and order_item.order:
                buyer = order_item.order.user
                return buyer.mobile
        return None


class CartItemSerializer(serializers.ModelSerializer):
    ad = AdListSerializer(read_only=True)
    ad_id = serializers.PrimaryKeyRelatedField(
        source="ad",
        queryset=Ad.objects.filter(status=Ad.Status.APPROVED, is_sold=False),
        write_only=True,
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "ad", "ad_id", "quantity", "subtotal"]
        read_only_fields = ["id"]

    def get_subtotal(self, obj):
        return obj.ad.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(source="cart_items", many=True, read_only=True)
    total_price = serializers.IntegerField(read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total_price", "item_count"]

    def get_item_count(self, obj):
        return obj.cart_items.count()


class OrderItemSerializer(serializers.ModelSerializer):
    ad_title = serializers.CharField(source="ad.title", read_only=True)
    ad_price = serializers.IntegerField(source="price_at_time", read_only=True)
    seller_name = serializers.SerializerMethodField()
    seller_phone = serializers.SerializerMethodField()
    seller_avatar = serializers.SerializerMethodField()
    campus = serializers.CharField(source="ad.campus", read_only=True)
    location = serializers.CharField(source="ad.location", read_only=True)
    ad_id = serializers.UUIDField(source="ad.id", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "ad_id",
            "ad",
            "ad_title",
            "quantity",
            "price_at_time",
            "ad_price",
            "seller_name",
            "seller_phone",
            "seller_avatar",
            "campus",
            "location",
        ]

    def get_seller_name(self, obj):
        if obj.ad and obj.ad.user:
            return obj.ad.user.get_full_name() or obj.ad.user.mobile
        return "فروشنده"

    def get_seller_phone(self, obj):
        if obj.ad and obj.ad.user:
            return obj.ad.user.mobile
        return ""

    def get_seller_avatar(self, obj):
        try:
            if obj.ad and obj.ad.user and obj.ad.user.avatar:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.ad.user.avatar.file.url)
                return obj.ad.user.avatar.file.url
        except Exception:
            return None
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserBriefSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "total_price",
            "discount_amount",
            "coupon_discount",
            "final_price",
            "shipping_address",
            "shipping_cost",
            "coupon_code",
            "items",
            "paid_at",
            "delivered_at",
            "created_at",
        ]
        read_only_fields = ["id", "order_number", "user", "created_at"]


class OrderCreateSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_cost = serializers.IntegerField(default=0, min_value=0, required=False)


class AddToCartSerializer(serializers.Serializer):
    ad_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)

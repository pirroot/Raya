from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from apps.market.models import Category, Ad, Cart, CartItem, Order, OrderItem
from apps.market.serializers import (
    CategorySerializer,
    AdSerializer,
    AdListSerializer,
    CartSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)
from apps.market.services import MarketService
from apps.common.pagination import StandardPagination
from apps.common.permissions import IsAdminUser


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            return self.queryset.filter(parent_id=parent_id)
        return self.queryset.filter(parent__isnull=True)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]


class AdListCreateView(generics.ListCreateAPIView):
    serializer_class = AdListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        service = MarketService(self.request.user)
        filters = {}

        if self.request.query_params.get("category"):
            filters["category"] = self.request.query_params.get("category")
        if self.request.query_params.get("search"):
            filters["search"] = self.request.query_params.get("search")
        if self.request.query_params.get("condition"):
            filters["condition"] = self.request.query_params.get("condition")
        if self.request.query_params.get("min_price"):
            filters["min_price"] = self.request.query_params.get("min_price")
        if self.request.query_params.get("max_price"):
            filters["max_price"] = self.request.query_params.get("max_price")
        if self.request.query_params.get("featured") == "true":
            filters["is_featured"] = True

        return service.get_ads(filters)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdSerializer
        return AdListSerializer

    def create(self, request, *args, **kwargs):
        service = MarketService(request.user)
        serializer = AdSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        ad = service.create_ad(
            data=serializer.validated_data, images_data=request.FILES.getlist("images")
        )

        return Response(
            AdSerializer(ad, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]


class AdDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AdSerializer

    def get_object(self):
        service = MarketService(self.request.user)
        if self.request.method == "GET":
            return service.get_ad_detail(self.kwargs["pk"])
        return Ad.objects.get(id=self.kwargs["pk"])

    def update(self, request, *args, **kwargs):
        service = MarketService(request.user)
        ad = service.update_ad(kwargs["pk"], request.data)
        return Response(AdSerializer(ad, context={"request": request}).data)

    def delete(self, request, *args, **kwargs):
        service = MarketService(request.user)
        service.delete_ad(kwargs["pk"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]


class UserAdsView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        service = MarketService(self.request.user)
        return service.get_user_ads()


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        service = MarketService(self.request.user)
        return service.get_or_create_cart()


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = MarketService(request.user)
        cart = service.add_to_cart(
            ad_id=serializer.validated_data["ad_id"],
            quantity=serializer.validated_data.get("quantity", 1),
        )

        return Response(CartSerializer(cart).data)


class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = MarketService(request.user)
        cart = service.update_cart_item(
            cart_item_id=pk, quantity=serializer.validated_data["quantity"]
        )

        return Response(CartSerializer(cart).data)


class RemoveFromCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        service = MarketService(request.user)
        cart = service.remove_from_cart(pk)
        return Response(CartSerializer(cart).data)


class ClearCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        service = MarketService(request.user)
        cart = service.clear_cart()
        return Response(CartSerializer(cart).data)


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        service = MarketService(self.request.user)
        status_filter = self.request.query_params.get("status")
        return service.get_user_orders(status_filter)

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = MarketService(request.user)
        order = service.create_order(serializer.validated_data)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_object(self):
        service = MarketService(self.request.user)
        return service.get_order_detail(self.kwargs["pk"])

    def delete(self, request, *args, **kwargs):
        service = MarketService(request.user)
        order = service.cancel_order(kwargs["pk"])
        return Response(OrderSerializer(order).data)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        service = MarketService(request.user)
        order = service.cancel_order(pk)
        return Response(OrderSerializer(order).data)


class ConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        service = MarketService(request.user)
        ad = service.confirm_delivery(pk)
        return Response(AdSerializer(ad).data)

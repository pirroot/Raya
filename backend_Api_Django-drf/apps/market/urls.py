from django.urls import path
from apps.market.views import *

app_name = "market"

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<uuid:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("ads/", AdListCreateView.as_view(), name="ad-list"),
    path("ads/<uuid:pk>/", AdDetailView.as_view(), name="ad-detail"),
    path("my-ads/", UserAdsView.as_view(), name="my-ads"),
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", AddToCartView.as_view(), name="cart-add"),
    path("cart/clear/", ClearCartView.as_view(), name="cart-clear"),
    path(
        "cart/items/<uuid:pk>/", UpdateCartItemView.as_view(), name="cart-item-update"
    ),
    path(
        "cart/items/<uuid:pk>/remove/",
        RemoveFromCartView.as_view(),
        name="cart-item-remove",
    ),
    path("orders/", OrderListCreateView.as_view(), name="order-list"),
    path("orders/<uuid:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<uuid:pk>/cancel/", CancelOrderView.as_view(), name="order-cancel"),
    path(
        "ads/<uuid:pk>/confirm-delivery/",
        ConfirmDeliveryView.as_view(),
        name="confirm-delivery",
    ),
]

from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Banner
from .serializers import BannerSerializer
from apps.common.pagination import StandardPagination


class BannerListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BannerSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        placement = self.request.query_params.get("placement")
        queryset = Banner.objects.filter(
            is_active=True,
            starts_at__lte=timezone.now(),
            ends_at__gte=timezone.now(),
        )
        if placement:
            queryset = queryset.filter(placement=placement)
        return queryset

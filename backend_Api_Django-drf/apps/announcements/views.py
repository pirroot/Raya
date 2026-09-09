from rest_framework import generics, permissions
from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementListView(generics.ListAPIView):
    """GET /api/v1/announcements/ - لیست اطلاعیه‌ها"""

    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Announcement.objects.filter(is_active=True).order_by(
            "-is_pinned", "-date"
        )

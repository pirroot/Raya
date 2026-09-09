from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    MarkAllReadSerializer,
)
from apps.notifications.services import NotificationService
from apps.common.pagination import StandardPagination


class NotificationListView(generics.ListAPIView):
    """لیست اعلان‌های کاربر"""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        only_unread = self.request.query_params.get("unread") == "true"
        return NotificationService.get_user_notifications(
            self.request.user, only_unread=only_unread
        )


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    """جزئیات و علامت‌گذاری اعلان"""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    lookup_field = "id"

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.mark_as_read()
        return Response(NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    """علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = NotificationService.mark_all_as_read(request.user)
        return Response({"marked_count": count})


class UnreadCountView(APIView):
    """تعداد اعلان‌های خوانده نشده"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({"unread_count": count})


class DeleteNotificationView(generics.DestroyAPIView):
    """حذف اعلان"""

    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

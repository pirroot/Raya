from django.urls import path
from apps.notifications.views import *

app_name = "notifications"

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<uuid:id>/", NotificationDetailView.as_view(), name="notification-detail"),
    path(
        "<uuid:id>/delete/",
        DeleteNotificationView.as_view(),
        name="notification-delete",
    ),
    path("mark-all-read/", MarkAllReadView.as_view(), name="mark-all-read"),
    path("unread-count/", UnreadCountView.as_view(), name="unread-count"),
]

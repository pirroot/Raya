from django.urls import path
from .views import AnnouncementListView

app_name = "announcements"

urlpatterns = [
    path("announcements/", AnnouncementListView.as_view(), name="announcement-list"),
]

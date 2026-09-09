from django.urls import path

from .views import MediaUploadView

app_name = "storage"

urlpatterns = [
    path("upload/", MediaUploadView.as_view(), name="media-upload"),
]

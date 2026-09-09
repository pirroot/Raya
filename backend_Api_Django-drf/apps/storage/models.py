from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class MediaFile(BaseModel):
    file = models.FileField(upload_to="uploads/%Y/%m/%d/")
    file_type = models.CharField(
        max_length=20,
        choices=[
            ("image", "تصویر"),
            ("video", "ویدیو"),
            ("pdf", "PDF"),
            ("other", "سایر"),
        ],
    )
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)  # ← default=0 اضافه شد
    mime_type = models.CharField(max_length=100)
    cdn_url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.file_name

    def delete(self, *args, **kwargs):
        if self.file:
            self.file.delete()
        super().delete(*args, **kwargs)

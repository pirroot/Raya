from django.db import models
from apps.common.models import BaseModel


class Banner(BaseModel):
    class Placement(models.TextChoices):
        HOME_TOP = "home_top", "بالای صفحه اصلی"
        HOME_MIDDLE = "home_middle", "وسط صفحه اصلی"
        COURSE_PAGE = "course_page", "صفحه دوره"

    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to="banners/%Y/%m/%d/")
    link_url = models.URLField(blank=True, null=True)
    placement = models.CharField(
        max_length=30,
        choices=Placement.choices,
        default=Placement.HOME_TOP,
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "banners"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["placement", "is_active"]),
            models.Index(fields=["order"]),
        ]
        verbose_name = "بنر"
        verbose_name_plural = "بنرها"

    def __str__(self):
        return self.title

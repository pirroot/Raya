from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "اعلان‌ها"

    def ready(self):
        # signals رو فعلاً غیرفعال کن
        # import apps.notifications.signals
        pass

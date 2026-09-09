from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_default_categories(sender, **kwargs):
    from .models import Category

    defaults = [
        {"title": "کتاب و جزوه", "slug": "books-notes", "icon": "📚"},
        {"title": "دیجیتال", "slug": "electronics", "icon": "💻"},
        {"title": "خوابگاه", "slug": "dorm-life", "icon": "🛏️"},
        {"title": "خدمات", "slug": "services", "icon": "🔧"},
        {"title": "پوشاک", "slug": "clothing", "icon": "👕"},
        {"title": "ورزشی", "slug": "sports", "icon": "⚽"},
    ]

    for data in defaults:
        Category.objects.get_or_create(
            slug=data["slug"],
            defaults={
                "title": data["title"],
                "icon": data["icon"],
                "is_active": True,
            },
        )


class MarketConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.market"
    verbose_name = "بازارچه"

    def ready(self):
        post_migrate.connect(create_default_categories, sender=self)

from django.contrib import admin
from django.contrib.admin.apps import AdminConfig


class CustomAdminConfig(AdminConfig):
    default_site = "config.admin.CustomAdminSite"


class CustomAdminSite(admin.AdminSite):
    site_header = "پنل مدیریت هشیار"
    site_title = "پنل مدیریت هشیار"
    index_title = "داشبورد مدیریت"
    site_url = "/"

    def get_app_list(self, request):
        app_list = super().get_app_list(request)

        # تغییر نام اپ‌ها به فارسی
        app_translations = {
            "Auth": "احراز هویت",
            "Users": "کاربران",
            "Wallet": "کیف پول",
            "Coins": "سکه‌ها",
            "Education": "آموزش",
            "Market": "بازارچه",
            "Banners": "بنرها",
            "Ads": "آگهی‌ها",
            "Storage": "ذخیره‌سازی",
            "RBAC": "مدیریت دسترسی",
            "AI": "هوش مصنوعی",
        }

        for app in app_list:
            app_name = app.get("name", "")
            if app_name in app_translations:
                app["name"] = app_translations[app_name]

            # تغییر نام مدل‌ها
            for model in app.get("models", []):
                model_name = model.get("name", "")
                model_translations = {
                    "Banners": "بنرها",
                    "Banner": "بنر",
                    "User": "کاربر",
                    "Users": "کاربران",
                    "Wallet": "کیف پول",
                    "Coin packages": "بسته‌های سکه",
                    "Coin transactions": "تراکنش‌های سکه",
                    "Market categories": "دسته‌بندی‌های بازارچه",
                    "Market products": "محصولات بازارچه",
                    "Cart items": "سبد خرید",
                    "Orders": "سفارش‌ها",
                    "Order items": "آیتم‌های سفارش",
                    "Ads": "آگهی‌ها",
                    "Ad": "آگهی",
                    "Media files": "فایل‌های رسانه",
                }
                if model_name in model_translations:
                    model["name"] = model_translations[model_name]

        return app_list

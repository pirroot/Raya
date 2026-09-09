from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTPRequest, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-created_at"]

    # ===== لیست ستون‌ها =====
    list_display = [
        "mobile",
        "username",
        "first_name",
        "last_name",
        "email",
        "mobile_verified",
        "is_active",
        "is_staff",
        "is_teacher",
        "created_at",
    ]
    list_display_links = ["mobile", "username"]

    # ===== فیلترها =====
    list_filter = [
        "is_active",
        "is_staff",
        "is_teacher",
        "mobile_verified",
        "education_level",
        "status",
    ]

    # ===== جستجو =====
    search_fields = ["mobile", "username", "email", "first_name", "last_name"]

    # ===== فیلدهای فقط خواندنی =====
    readonly_fields = ["id", "created_at", "updated_at", "last_login_at"]

    # ===== بخش‌بندی فرم ویرایش =====
    fieldsets = (
        (None, {"fields": ("mobile", "password")}),
        (
            "اطلاعات شخصی",
            {
                "fields": (
                    "username",
                    "first_name",
                    "last_name",
                    "email",
                    "bio",
                    "avatar",
                    "birth_date",
                )
            },
        ),
        (
            "اطلاعات تحصیلی",
            {
                "fields": (
                    "student_code",
                    "education_level",
                )
            },
        ),
        (
            "وضعیت کاربر",
            {
                "fields": (
                    "status",
                    "interests",
                )
            },
        ),
        (
            "دسترسی‌ها",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_teacher",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            "تاریخ‌های مهم",
            {
                "fields": (
                    "last_login_at",
                    "mobile_verified",
                    "email_verified",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    # ===== فرم افزودن کاربر جدید =====
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("mobile", "password1", "password2"),
            },
        ),
    )


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = [
        "mobile",
        "purpose",
        "is_used",
        "attempts",
        "expires_at",
        "created_at",
    ]
    list_display_links = ["mobile"]
    list_filter = ["purpose", "is_used"]
    search_fields = ["mobile"]
    readonly_fields = ["code_hash", "created_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "اطلاعات OTP",
            {"fields": ("mobile", "purpose", "code_hash", "is_used", "attempts")},
        ),
        ("زمان", {"fields": ("expires_at", "created_at"), "classes": ("collapse",)}),
    )

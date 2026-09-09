from django.contrib import admin
from .models import Competition, CompetitionRegistration


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "participants_count", "deadline", "is_active"]
    list_filter = ["status", "is_active"]
    search_fields = ["title", "description"]
    exclude = ["deleted_at"]  # ← این رو اضافه کن تا فیلد deleted_at نمایش داده نشه
    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("title", "description", "prize")}),
        ("زمان‌بندی", {"fields": ("deadline", "status")}),
        ("تنظیمات", {"fields": ("is_active",)}),
        ("آمار", {"fields": ("participants_count",)}),
    )
    readonly_fields = ["participants_count", "created_at", "updated_at"]


@admin.register(CompetitionRegistration)
class CompetitionRegistrationAdmin(admin.ModelAdmin):
    list_display = ["user", "competition", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__mobile", "competition__title"]
    raw_id_fields = ["user", "competition"]
    exclude = ["deleted_at"]  # ← این رو اضافه کن

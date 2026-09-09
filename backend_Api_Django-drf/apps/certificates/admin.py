from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["user", "course", "code", "issued_at", "is_verified"]
    list_filter = ["is_verified", "issued_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "course__title",
        "code",
    ]
    readonly_fields = ["code", "issued_at"]
    raw_id_fields = ["user", "course"]
    ordering = ["-issued_at"]

    fieldsets = (
        ("کاربر و دوره", {"fields": ("user", "course")}),
        ("اطلاعات گواهی", {"fields": ("code", "issued_at", "is_verified")}),
        ("فایل", {"fields": ("certificate_file",), "classes": ("collapse",)}),
    )

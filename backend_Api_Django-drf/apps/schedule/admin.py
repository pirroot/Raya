from django.contrib import admin
from .models import ClassSchedule


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = [
        "course_name",
        "teacher",
        "day",
        "time_start",
        "time_end",
        "faculty",
        "is_active",
    ]
    list_display_links = ["course_name", "teacher"]
    list_filter = ["day", "faculty", "is_active"]
    search_fields = ["course_name", "teacher", "faculty", "room"]
    ordering = ["day", "time_start"]

    fieldsets = (
        ("اطلاعات درس", {"fields": ("course_name", "teacher", "faculty")}),
        ("زمان و مکان", {"fields": ("day", "time_start", "time_end", "room")}),
        ("تنظیمات", {"fields": ("is_active", "order")}),
    )

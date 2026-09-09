from django.contrib import admin
from .models import AiSession, AiMessage, AiFile, AiUsage


@admin.register(AiSession)
class AiSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__mobile", "title"]
    raw_id_fields = ["user"]


@admin.register(AiMessage)
class AiMessageAdmin(admin.ModelAdmin):
    list_display = ["session", "role", "content", "status", "created_at"]
    list_filter = ["role", "status"]
    search_fields = ["content"]
    raw_id_fields = ["session"]


@admin.register(AiFile)
class AiFileAdmin(admin.ModelAdmin):
    list_display = ["user", "filename", "size", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["filename", "user__mobile"]
    raw_id_fields = ["user", "session"]


@admin.register(AiUsage)
class AiUsageAdmin(admin.ModelAdmin):
    list_display = ["user", "used_free_messages", "daily_free_limit", "paid_messages", "free_window_ends_at"]
    list_filter = ["free_window_ends_at"]
    search_fields = ["user__mobile"]
    raw_id_fields = ["user"]

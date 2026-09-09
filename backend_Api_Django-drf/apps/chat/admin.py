from django.contrib import admin
from apps.chat.models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "last_message", "last_message_at", "created_at"]
    filter_horizontal = ["participants"]
    search_fields = ["id", "last_message"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        "conversation",
        "sender",
        "content_preview",
        "is_read",
        "created_at",
    ]
    list_filter = ["is_read", "created_at"]
    search_fields = ["content", "sender__mobile"]
    raw_id_fields = ["conversation", "sender"]
    readonly_fields = ["created_at", "updated_at"]

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "متن پیام"

from django.urls import path
from apps.chat.views import *

app_name = "chat"

urlpatterns = [
    path("", ConversationListView.as_view(), name="conversation-list"),
    path("create/", ConversationCreateView.as_view(), name="conversation-create"),
    path("<str:id>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path("<str:id>/messages/", MessageListView.as_view(), name="message-list"),
    path("<str:id>/send/", MessageSendView.as_view(), name="message-send"),
    path("<str:id>/read/", MarkAsReadView.as_view(), name="mark-as-read"),
    path("unread-count/", UnreadCountView.as_view(), name="unread-count"),
]

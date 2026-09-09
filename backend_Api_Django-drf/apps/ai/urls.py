from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AiBootstrapView,
    SessionViewSet,
    SessionHistoryView,
    SessionSettingsView,
    MessageSendView,
    FileUploadView,
    UsageView,
    BalanceView,
)

router = DefaultRouter()
router.register(r"ai/sessions", SessionViewSet, basename="ai-sessions")

app_name = "ai"

urlpatterns = [
    # Bootstrap
    path("ai/bootstrap/", AiBootstrapView.as_view(), name="ai-bootstrap"),
    # Sessions (GET, POST, DELETE via ViewSet)
    path("", include(router.urls)),
    # Session detail views - مسیرها رو با <uuid:pk> درست کن
    path(
        "ai/sessions/<uuid:pk>/history/",
        SessionHistoryView.as_view(),
        name="ai-session-history",
    ),
    path(
        "ai/sessions/<uuid:pk>/settings/",
        SessionSettingsView.as_view(),
        name="ai-session-settings",
    ),
    path(
        "ai/sessions/<uuid:pk>/messages/",
        MessageSendView.as_view(),
        name="ai-send-message",
    ),
    # Files
    path("ai/files/", FileUploadView.as_view(), name="ai-file-upload"),
    # Usage & Balance
    path("ai/usage/", UsageView.as_view(), name="ai-usage"),
    path("ai/balance/", BalanceView.as_view(), name="ai-balance"),
]

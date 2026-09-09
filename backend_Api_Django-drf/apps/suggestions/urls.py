from django.urls import path
from .views import (
    SuggestionListView,
    MySuggestionsView,
    SuggestionLikeView,
    SuggestionAdminView,
)

app_name = "suggestions"

urlpatterns = [
    path("suggestions/", SuggestionListView.as_view(), name="suggestion-list"),
    path("suggestions/my/", MySuggestionsView.as_view(), name="my-suggestions"),
    path(
        "suggestions/<uuid:pk>/like/",
        SuggestionLikeView.as_view(),
        name="suggestion-like",
    ),
    path(
        "suggestions/<uuid:pk>/admin/",
        SuggestionAdminView.as_view(),
        name="suggestion-admin",
    ),
]

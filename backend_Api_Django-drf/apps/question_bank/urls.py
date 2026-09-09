# apps/question_bank/urls.py
from django.urls import path
from .views import (
    CategoryListView,
    QuestionListView,
    QuestionDetailView,
    QuestionCreateView,
    QuestionDownloadView,
    QuestionLikeView,
    QuestionPurchaseView,
)

app_name = "question_bank"

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("questions/", QuestionListView.as_view(), name="question-list"),
    path("questions/create/", QuestionCreateView.as_view(), name="question-create"),
    path("questions/<uuid:id>/", QuestionDetailView.as_view(), name="question-detail"),
    path(
        "questions/<uuid:pk>/download/",
        QuestionDownloadView.as_view(),
        name="question-download",
    ),
    path("questions/<uuid:pk>/like/", QuestionLikeView.as_view(), name="question-like"),
    path(
        "questions/<uuid:pk>/purchase/",
        QuestionPurchaseView.as_view(),
        name="question-purchase",
    ),
]

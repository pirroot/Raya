from django.urls import path
from .views import (
    TestListView,
    TestDetailView,
    TestQuestionsView,
    TestPurchaseView,
    TestCompleteView,
    TestResultView,
    MyTestResultsView,
)

app_name = "psychology_tests"

urlpatterns = [
    path("psychology-tests/", TestListView.as_view(), name="test-list"),
    path("psychology-tests/<uuid:pk>/", TestDetailView.as_view(), name="test-detail"),
    path(
        "psychology-tests/<uuid:pk>/questions/",
        TestQuestionsView.as_view(),
        name="test-questions",
    ),
    path(
        "psychology-tests/<uuid:pk>/purchase/",
        TestPurchaseView.as_view(),
        name="test-purchase",
    ),
    path(
        "psychology-tests/<uuid:pk>/complete/",
        TestCompleteView.as_view(),
        name="test-complete",
    ),
    path(
        "psychology-tests/<uuid:pk>/result/",
        TestResultView.as_view(),
        name="test-result",
    ),
    path("psychology-tests/results/", MyTestResultsView.as_view(), name="my-results"),
]

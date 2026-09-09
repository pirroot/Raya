from django.urls import path
from .views import (
    CompetitionListView,
    CompetitionRegisterView,
    CompetitionUnregisterView,
)

app_name = "competitions"

urlpatterns = [
    path("competitions/", CompetitionListView.as_view(), name="competition-list"),
    path(
        "competitions/<uuid:pk>/register/",
        CompetitionRegisterView.as_view(),
        name="competition-register",
    ),
    path(
        "competitions/<uuid:pk>/unregister/",
        CompetitionUnregisterView.as_view(),
        name="competition-unregister",
    ),
]

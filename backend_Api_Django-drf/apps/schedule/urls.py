from django.urls import path
from .views import ScheduleListView, ScheduleFacultiesView, ScheduleDaysView

app_name = "schedule"

urlpatterns = [
    path("schedule/", ScheduleListView.as_view(), name="schedule-list"),
    path(
        "schedule/faculties/",
        ScheduleFacultiesView.as_view(),
        name="schedule-faculties",
    ),
    path("schedule/days/", ScheduleDaysView.as_view(), name="schedule-days"),
]

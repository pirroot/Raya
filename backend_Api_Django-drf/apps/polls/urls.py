from django.urls import path
from .views import PollListView, PastPollsView, PollVoteView

app_name = "polls"

urlpatterns = [
    path("polls/", PollListView.as_view(), name="poll-list"),
    path("polls/past/", PastPollsView.as_view(), name="past-polls"),
    path("polls/<uuid:pk>/vote/", PollVoteView.as_view(), name="poll-vote"),
]

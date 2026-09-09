from django.urls import path
from .views import QAListView, QADetailView, QALikeView

app_name = "qna"

urlpatterns = [
    path("qna/", QAListView.as_view(), name="qna-list"),
    path("qna/<uuid:pk>/", QADetailView.as_view(), name="qna-detail"),
    path("qna/<uuid:pk>/like/", QALikeView.as_view(), name="qna-like"),
]

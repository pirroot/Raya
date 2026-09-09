from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Suggestion
from .serializers import SuggestionSerializer


class SuggestionListView(generics.ListCreateAPIView):
    """GET /api/v1/suggestions/ - لیست پیشنهادات
    POST /api/v1/suggestions/ - ثبت پیشنهاد جدید
    """

    serializer_class = SuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Suggestion.objects.filter(status=Suggestion.Status.APPROVED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MySuggestionsView(generics.ListAPIView):
    """GET /api/v1/suggestions/my/ - پیشنهادات من"""

    serializer_class = SuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Suggestion.objects.filter(user=self.request.user)


class SuggestionLikeView(APIView):
    """POST /api/v1/suggestions/<id>/like/ - لایک/آنلایک"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            suggestion = Suggestion.objects.get(pk=pk)
            likes = suggestion.toggle_like(request.user)
            is_liked = request.user in suggestion.liked_by.all()
            return Response({"likes": likes, "is_liked": is_liked})
        except Suggestion.DoesNotExist:
            return Response(
                {"error": "پیشنهاد یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )


class SuggestionAdminView(generics.UpdateAPIView):
    """PATCH /api/v1/suggestions/<id>/admin/ - تغییر وضعیت (فقط ادمین)"""

    queryset = Suggestion.objects.all()
    serializer_class = SuggestionSerializer
    permission_classes = [permissions.IsAdminUser]

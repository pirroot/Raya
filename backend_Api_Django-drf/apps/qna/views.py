from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import QA
from .serializers import QASerializer


class QAListView(generics.ListAPIView):
    """GET /api/v1/qna/ - لیست پرسش و پاسخ‌ها"""

    serializer_class = QASerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return QA.objects.filter(is_active=True).order_by("order", "created_at")


class QADetailView(generics.RetrieveAPIView):
    """GET /api/v1/qna/<id>/ - جزئیات یک پرسش و پاسخ"""

    queryset = QA.objects.filter(is_active=True)
    serializer_class = QASerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=["views"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class QALikeView(APIView):
    """POST /api/v1/qna/<id>/like/ - افزایش لایک"""

    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            qa = QA.objects.get(pk=pk, is_active=True)
            qa.likes += 1
            qa.save(update_fields=["likes"])
            return Response({"likes": qa.likes})
        except QA.DoesNotExist:
            return Response(
                {"error": "پرسش و پاسخ یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )

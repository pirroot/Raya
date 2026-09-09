from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Certificate
from .serializers import CertificateSerializer
from .services import CertificateService
from apps.education.models import Course


class MyCertificatesView(generics.ListAPIView):
    """لیست گواهی‌های کاربر"""

    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user).order_by("-issued_at")


class GenerateCertificateView(APIView):
    """صدور گواهی برای دوره"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        try:
            service = CertificateService(request.user)
            result = service.generate_certificate(course_id)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "خطا در صدور گواهی"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyCertificateView(APIView):
    """اعتبارسنجی گواهی با کد"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        service = CertificateService(None)
        result = service.verify_certificate(code)
        return Response(result, status=status.HTTP_200_OK)


class CertificateDetailView(generics.RetrieveAPIView):
    """جزئیات یک گواهی"""

    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

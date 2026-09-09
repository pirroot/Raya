from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import Competition, CompetitionRegistration
from .serializers import CompetitionSerializer, CompetitionRegistrationSerializer


class CompetitionListView(generics.ListAPIView):
    """GET /api/v1/competitions/ - لیست مسابقات"""

    serializer_class = CompetitionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Competition.objects.filter(is_active=True).order_by("-created_at")


class CompetitionRegisterView(APIView):
    """POST /api/v1/competitions/<id>/register/ - ثبت نام در مسابقه"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            competition = Competition.objects.get(pk=pk, is_active=True)
        except Competition.DoesNotExist:
            return Response(
                {"error": "مسابقه یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )

        # چک کردن اینکه مسابقه فعال باشه
        if competition.status != Competition.Status.ACTIVE:
            return Response(
                {"error": "امکان ثبت نام در این مسابقه وجود ندارد"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # چک کردن ثبت نام قبلی
        if CompetitionRegistration.objects.filter(
            user=request.user, competition=competition
        ).exists():
            return Response(
                {"error": "شما قبلاً در این مسابقه ثبت نام کرده‌اید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ثبت نام
        registration = CompetitionRegistration.objects.create(
            user=request.user, competition=competition
        )

        # افزایش تعداد شرکت‌کنندگان
        competition.participants_count += 1
        competition.save(update_fields=["participants_count"])

        serializer = CompetitionRegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CompetitionUnregisterView(APIView):
    """DELETE /api/v1/competitions/<id>/register/ - انصراف از ثبت نام"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def delete(self, request, pk):
        try:
            competition = Competition.objects.get(pk=pk)
        except Competition.DoesNotExist:
            return Response(
                {"error": "مسابقه یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            registration = CompetitionRegistration.objects.get(
                user=request.user, competition=competition
            )
        except CompetitionRegistration.DoesNotExist:
            return Response(
                {"error": "شما در این مسابقه ثبت نام نکرده‌اید"},
                status=status.HTTP_404_NOT_FOUND,
            )

        registration.delete()
        competition.participants_count -= 1
        competition.save(update_fields=["participants_count"])

        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework import generics, permissions
from django.db.models import Q
from .models import ClassSchedule
from .serializers import ClassScheduleSerializer
from rest_framework.response import Response


class ScheduleListView(generics.ListAPIView):
    """GET /api/v1/schedule/ - لیست برنامه کلاسی با فیلتر"""

    serializer_class = ClassScheduleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = ClassSchedule.objects.filter(is_active=True)

        # فیلتر بر اساس روز
        day = self.request.query_params.get("day")
        if day:
            queryset = queryset.filter(day=day)

        # فیلتر بر اساس دانشکده
        faculty = self.request.query_params.get("faculty")
        if faculty:
            queryset = queryset.filter(faculty=faculty)

        # جستجو
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(course_name__icontains=search)
                | Q(teacher__icontains=search)
                | Q(room__icontains=search)
            )

        return queryset


class ScheduleFacultiesView(generics.ListAPIView):
    """GET /api/v1/schedule/faculties/ - لیست دانشکده‌ها"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faculties = (
            ClassSchedule.objects.filter(is_active=True)
            .values_list("faculty", flat=True)
            .distinct()
        )
        return Response(sorted(set(faculties)))


class ScheduleDaysView(generics.ListAPIView):
    """GET /api/v1/schedule/days/ - لیست روزها"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        days = (
            ClassSchedule.objects.filter(is_active=True)
            .values_list("day", flat=True)
            .distinct()
        )
        day_order = [
            "شنبه",
            "یکشنبه",
            "دوشنبه",
            "سه‌شنبه",
            "چهارشنبه",
            "پنجشنبه",
            "جمعه",
        ]
        sorted_days = sorted(
            set(days), key=lambda x: day_order.index(x) if x in day_order else 999
        )
        return Response(sorted_days)

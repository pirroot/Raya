from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from .models import Category, Course, Enrollment, Lesson
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateSerializer,
    EnrollmentSerializer,
    ProgressUpdateSerializer,
    LessonSerializer,
)
from .permissions import IsTeacher, IsCourseTeacher, IsEnrolled
from .services import EducationService


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Course.objects.filter(is_published=True)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        level = self.request.query_params.get("level")
        if level:
            queryset = queryset.filter(level=level)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search)
                | models.Q(description__icontains=search)
                | models.Q(teacher__first_name__icontains=search)
                | models.Q(teacher__last_name__icontains=search)
            )

        sort = self.request.query_params.get("sort", "-created_at")
        queryset = queryset.order_by(sort)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CourseCreateView(generics.CreateAPIView):
    serializer_class = CourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class CourseUpdateView(generics.UpdateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsCourseTeacher]
    lookup_field = "id"


class CourseDeleteView(generics.DestroyAPIView):
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsCourseTeacher]
    lookup_field = "id"


# apps/education/views.py - CourseEnrollView


class CourseEnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        try:
            print("=" * 50)
            print(f"📚 Enroll request for course: {id}")
            print(f"👤 User: {request.user}")

            course = Course.objects.get(id=id, is_published=True)
            print(f"📖 Course: {course.title}")
            print(f"💰 Price: {course.price}")

            service = EducationService(request.user)
            result = service.enroll_course(id)
            print(f"✅ Success: {result}")
            return Response(result, status=status.HTTP_200_OK)

        except Course.DoesNotExist:
            print("❌ Course not found")
            return Response(
                {"error": "دوره یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            print(f"❌ ValueError: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            import traceback

            traceback.print_exc()
            return Response(
                {"error": "خطای داخلی سرور"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CourseProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            enrollment = Enrollment.objects.get(
                user=request.user, course_id=id, status=Enrollment.Status.ACTIVE
            )
            return Response(
                {
                    "progress": enrollment.progress,
                    "status": enrollment.status,
                    "completed_at": enrollment.completed_at,
                }
            )
        except Enrollment.DoesNotExist:
            return Response(
                {"error": "شما در این دوره ثبت‌نام نکرده‌اید"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request, id):
        serializer = ProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            enrollment = Enrollment.objects.get(
                user=request.user, course_id=id, status=Enrollment.Status.ACTIVE
            )

            progress = serializer.validated_data["progress"]
            enrollment.progress = progress

            if progress >= 100:
                enrollment.status = Enrollment.Status.COMPLETED
                from django.utils import timezone

                enrollment.completed_at = timezone.now()

            enrollment.save()

            return Response(
                {
                    "success": True,
                    "progress": enrollment.progress,
                    "status": enrollment.status,
                },
                status=status.HTTP_200_OK,
            )

        except Enrollment.DoesNotExist:
            return Response(
                {"error": "ثبت‌نام یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )


class MyCoursesView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        enrollments = Enrollment.objects.filter(
            user=self.request.user, status=Enrollment.Status.ACTIVE
        )
        return Course.objects.filter(
            id__in=enrollments.values_list("course_id", flat=True), is_published=True
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CourseLessonsView(generics.ListAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnrolled]

    def get_queryset(self):
        course_id = self.kwargs["id"]
        return Lesson.objects.filter(chapter__course_id=course_id).order_by(
            "chapter__order", "order"
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class LessonCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id, lesson_id):
        try:
            service = EducationService(request.user)
            enrollment = Enrollment.objects.get(
                user=request.user, course_id=course_id, status=Enrollment.Status.ACTIVE
            )
            result = service.mark_lesson_complete(enrollment.id, lesson_id)
            return Response(result, status=status.HTTP_200_OK)
        except (Enrollment.DoesNotExist, Lesson.DoesNotExist):
            return Response({"error": "یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

from rest_framework import serializers
from .models import Category, Course, Chapter, Lesson, Enrollment, LessonProgress


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "title", "slug", "icon", "gradient", "is_active"]


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "description",
            "video_url",
            "duration",
            "order",
            "is_free",
            "is_completed",
        ]

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(
                user=request.user,
                course=obj.chapter.course,
                status=Enrollment.Status.ACTIVE,
            ).first()
            if enrollment:
                return LessonProgress.objects.filter(
                    enrollment=enrollment, lesson=obj, is_completed=True
                ).exists()
        return False


class ChapterSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ["id", "title", "order", "lessons"]


class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    teacher_name = serializers.CharField(source="teacher.get_full_name", read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "teacher_name",
            "category",
            "level",
            "price",
            "duration",
            "lessons_count",
            "students_count",
            "rating",
            "badge",
            "is_featured",
            "is_published",
            "thumbnail",
            "is_enrolled",
            "created_at",
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(
                user=request.user, course=obj, status=Enrollment.Status.ACTIVE
            ).exists()
        return False


class CourseDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    teacher_name = serializers.CharField(source="teacher.get_full_name", read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "teacher_name",
            "category",
            "level",
            "price",
            "duration",
            "lessons_count",
            "students_count",
            "rating",
            "badge",
            "is_featured",
            "is_published",
            "thumbnail",
            "video_url",
            "attachment_url",
            "chapters",
            "is_enrolled",
            "progress",
            "created_at",
            "updated_at",
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(
                user=request.user, course=obj, status=Enrollment.Status.ACTIVE
            ).exists()
        return False

    def get_progress(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(
                user=request.user, course=obj, status=Enrollment.Status.ACTIVE
            ).first()
            if enrollment:
                return enrollment.progress
        return 0


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "category",
            "title",
            "description",
            "level",
            "price",
            "duration",
            "badge",
            "is_featured",
            "is_published",
            "thumbnail",
            "video_url",
            "attachment_url",
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    course_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "user",
            "course",
            "course_id",
            "status",
            "progress",
            "price_paid",
            "enrolled_at",
            "completed_at",
        ]
        read_only_fields = [
            "user",
            "status",
            "progress",
            "price_paid",
            "enrolled_at",
            "completed_at",
        ]


class ProgressUpdateSerializer(serializers.Serializer):
    progress = serializers.IntegerField(min_value=0, max_value=100)

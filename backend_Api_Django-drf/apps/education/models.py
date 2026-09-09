from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Category(BaseModel):
    """دسته‌بندی دوره‌ها"""

    title = models.CharField(max_length=100, verbose_name="عنوان")
    slug = models.SlugField(unique=True, verbose_name="اسلاگ")
    icon = models.CharField(max_length=50, blank=True, verbose_name="آیکون")
    gradient = models.CharField(max_length=100, blank=True, verbose_name="گرادیانت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        db_table = "education_categories"
        verbose_name = "دسته‌بندی"
        verbose_name_plural = "دسته‌بندی‌ها"

    def __str__(self):
        return self.title


class Course(BaseModel):
    """دوره آموزشی"""

    class Level(models.TextChoices):
        BEGINNER = "beginner", "مقدماتی"
        INTERMEDIATE = "intermediate", "متوسط"
        ADVANCED = "advanced", "پیشرفته"

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
        verbose_name="مدرس",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="courses",
        verbose_name="دسته‌بندی",
    )
    title = models.CharField(max_length=255, verbose_name="عنوان")
    description = models.TextField(verbose_name="توضیحات")
    level = models.CharField(
        max_length=20, choices=Level.choices, default=Level.BEGINNER, verbose_name="سطح"
    )
    price = models.PositiveIntegerField(default=0, verbose_name="قیمت (تومان)")
    duration = models.CharField(max_length=50, blank=True, verbose_name="مدت زمان")
    lessons_count = models.PositiveIntegerField(default=0, verbose_name="تعداد درس")
    rating = models.FloatField(default=0, verbose_name="امتیاز")
    students_count = models.PositiveIntegerField(default=0, verbose_name="تعداد دانشجو")
    badge = models.CharField(max_length=50, blank=True, verbose_name="نشان")
    is_featured = models.BooleanField(default=False, verbose_name="ویژه")
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    thumbnail = models.ImageField(
        upload_to="courses/thumbnails/",
        blank=True,
        null=True,
        verbose_name="تصویر شاخص",
    )
    video_url = models.URLField(max_length=500, blank=True, verbose_name="لینک ویدیو")
    attachment_url = models.URLField(
        max_length=500, blank=True, verbose_name="لینک فایل پیوست"
    )

    class Meta:
        db_table = "education_courses"
        ordering = ["-created_at"]
        verbose_name = "دوره"
        verbose_name_plural = "دوره‌ها"

    def __str__(self):
        return self.title

    def update_stats(self):
        """به‌روزرسانی آمار دوره"""
        self.students_count = self.enrollments.filter(status="active").count()
        self.lessons_count = (
            self.chapters.aggregate(total=models.Sum("lessons__count"))["total"] or 0
        )
        self.save(update_fields=["students_count", "lessons_count"])


class Chapter(BaseModel):
    """فصل‌های دوره"""

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="chapters", verbose_name="دوره"
    )
    title = models.CharField(max_length=200, verbose_name="عنوان")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")

    class Meta:
        db_table = "education_chapters"
        ordering = ["order"]
        verbose_name = "فصل"
        verbose_name_plural = "فصل‌ها"

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(BaseModel):
    """درس‌های هر فصل"""

    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="lessons", verbose_name="فصل"
    )
    title = models.CharField(max_length=200, verbose_name="عنوان")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    video_url = models.URLField(max_length=500, blank=True, verbose_name="لینک ویدیو")
    duration = models.CharField(max_length=20, blank=True, verbose_name="مدت زمان")
    order = models.PositiveIntegerField(default=0, verbose_name="ترتیب")
    is_free = models.BooleanField(default=False, verbose_name="رایگان (پیش‌نمایش)")

    class Meta:
        db_table = "education_lessons"
        ordering = ["order"]
        verbose_name = "درس"
        verbose_name_plural = "درس‌ها"

    def __str__(self):
        return f"{self.chapter.title} - {self.title}"


class Enrollment(BaseModel):
    """ثبت‌نام کاربر در دوره"""

    class Status(models.TextChoices):
        ACTIVE = "active", "فعال"
        COMPLETED = "completed", "تکمیل شده"
        DROPPED = "dropped", "انصراف داده"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name="کاربر",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name="دوره",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="وضعیت",
    )
    progress = models.PositiveIntegerField(default=0, verbose_name="پیشرفت")
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت‌نام")
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="تاریخ تکمیل"
    )
    price_paid = models.PositiveIntegerField(default=0, verbose_name="مبلغ پرداختی")

    class Meta:
        db_table = "education_enrollments"
        unique_together = [["user", "course"]]
        verbose_name = "ثبت‌نام"
        verbose_name_plural = "ثبت‌نام‌ها"

    def __str__(self):
        return f"{self.user} - {self.course}"


class LessonProgress(BaseModel):
    """پیشرفت کاربر در هر درس"""

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="lesson_progress",
        verbose_name="ثبت‌نام",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="user_progress",
        verbose_name="درس",
    )
    is_completed = models.BooleanField(default=False, verbose_name="تکمیل شده")
    last_watched_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بازدید")

    class Meta:
        db_table = "education_lesson_progress"
        unique_together = [["enrollment", "lesson"]]
        verbose_name = "پیشرفت درس"
        verbose_name_plural = "پیشرفت درس‌ها"

    def __str__(self):
        return f"{self.enrollment.user} - {self.lesson} - {'✅' if self.is_completed else '❌'}"

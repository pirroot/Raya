from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Category, Course, Chapter, Lesson, Enrollment, LessonProgress

User = get_user_model()


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_active"]
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ["title"]
    list_filter = ["is_active"]
    ordering = ["title"]

    fieldsets = (
        (
            "اطلاعات دسته‌بندی",
            {"fields": ("title", "slug", "icon", "gradient", "is_active")},
        ),
    )


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ["title", "duration", "order", "is_free", "video_url", "description"]
    ordering = ["order"]
    show_change_link = True


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 1
    fields = ["title", "order"]
    ordering = ["order"]
    show_change_link = True
    inlines = [LessonInline]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "teacher",
        "category",
        "level",
        "price",
        "students_count",
        "rating",
        "is_published",
        "is_featured",
        "created_at",
    ]
    list_display_links = ["title"]
    list_filter = ["level", "is_published", "is_featured", "category", "created_at"]
    search_fields = [
        "title",
        "description",
        "teacher__mobile",
        "teacher__first_name",
        "teacher__last_name",
    ]
    readonly_fields = [
        "students_count",
        "lessons_count",
        "rating",
        "created_at",
        "updated_at",
    ]
    inlines = [ChapterInline]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "اطلاعات اصلی",
            {"fields": ("teacher", "category", "title", "description", "level")},
        ),
        ("قیمت و زمان", {"fields": ("price", "duration", "badge")}),
        ("وضعیت انتشار", {"fields": ("is_published", "is_featured")}),
        (
            "فایل‌ها و رسانه",
            {
                "fields": ("thumbnail", "video_url", "attachment_url"),
                "classes": ("collapse",),
            },
        ),
        (
            "آمار و امتیازات",
            {
                "fields": ("students_count", "lessons_count", "rating"),
                "classes": ("collapse",),
            },
        ),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(teacher=request.user)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "teacher":
            kwargs["initial"] = request.user.id
            if not request.user.is_superuser:
                kwargs["queryset"] = User.objects.filter(id=request.user.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not change:  # اگر دوره جدید هست
            obj.teacher = request.user
        super().save_model(request, obj, form, change)


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ["title", "course", "order"]
    list_display_links = ["title"]
    list_filter = ["course"]
    search_fields = ["title", "course__title"]
    ordering = ["course", "order"]

    fieldsets = (("اطلاعات فصل", {"fields": ("course", "title", "order")}),)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["title", "chapter", "duration", "order", "is_free"]
    list_display_links = ["title"]
    list_filter = ["is_free", "chapter__course"]
    search_fields = ["title", "chapter__title", "chapter__course__title"]
    ordering = ["chapter__course", "chapter__order", "order"]

    fieldsets = (
        ("اطلاعات درس", {"fields": ("chapter", "title", "description", "order")}),
        ("ویدیو و زمان", {"fields": ("video_url", "duration", "is_free")}),
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["user", "course", "status", "progress", "price_paid", "enrolled_at"]
    list_display_links = ["user", "course"]
    list_filter = ["status", "course", "enrolled_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "course__title",
    ]
    readonly_fields = ["enrolled_at", "completed_at"]
    ordering = ["-enrolled_at"]

    fieldsets = (
        ("کاربر و دوره", {"fields": ("user", "course")}),
        ("وضعیت ثبت‌نام", {"fields": ("status", "progress", "price_paid")}),
        (
            "تاریخ‌ها",
            {"fields": ("enrolled_at", "completed_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ["enrollment", "lesson", "is_completed", "last_watched_at"]
    list_display_links = ["enrollment"]
    list_filter = ["is_completed", "last_watched_at"]
    search_fields = [
        "enrollment__user__mobile",
        "enrollment__course__title",
        "lesson__title",
    ]
    readonly_fields = ["last_watched_at"]

    fieldsets = (
        ("ثبت‌نام و درس", {"fields": ("enrollment", "lesson")}),
        ("وضعیت", {"fields": ("is_completed", "last_watched_at")}),
    )

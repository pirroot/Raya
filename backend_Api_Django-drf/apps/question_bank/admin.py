from django.contrib import admin
from .models import Category, Question, QuestionDownload, QuestionLike


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_active"]
    list_display_links = ["title"]
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ["title"]
    list_filter = ["is_active"]
    ordering = ["title"]

    fieldsets = (
        ("اطلاعات دسته‌بندی", {"fields": ("title", "slug", "icon", "is_active")}),
    )


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "category",
        "price_type",
        "price",
        "downloads",
        "likes",
        "is_approved",
        "created_at",
    ]
    list_display_links = ["title", "user"]
    list_filter = ["price_type", "is_approved", "category", "created_at"]
    search_fields = [
        "title",
        "description",
        "teacher",
        "user__mobile",
        "user__first_name",
        "user__last_name",
    ]
    readonly_fields = ["views", "downloads", "likes", "created_at", "updated_at"]
    ordering = ["-created_at"]
    actions = ["approve_questions", "unapprove_questions"]

    fieldsets = (
        (
            "اطلاعات سوال",
            {"fields": ("user", "category", "title", "description", "teacher")},
        ),
        ("قیمت", {"fields": ("price_type", "price")}),
        ("فایل", {"fields": ("file", "file_name", "file_size", "file_mime_type")}),
        ("آمار", {"fields": ("views", "downloads", "likes"), "classes": ("collapse",)}),
        ("وضعیت", {"fields": ("is_featured", "is_approved")}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def approve_questions(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f"{queryset.count()} سوال تایید شد.")

    approve_questions.short_description = "✅ تایید سوالات انتخابی"

    def unapprove_questions(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, f"{queryset.count()} سوال از تایید خارج شد.")

    unapprove_questions.short_description = "❌ لغو تایید سوالات انتخابی"


@admin.register(QuestionDownload)
class QuestionDownloadAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "question",
        "coins_spent",
        "is_first_download",
        "downloaded_at",
    ]
    list_display_links = ["user", "question"]
    list_filter = ["is_first_download", "downloaded_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "question__title",
    ]
    readonly_fields = ["downloaded_at"]
    ordering = ["-downloaded_at"]

    fieldsets = (
        ("کاربر و سوال", {"fields": ("user", "question")}),
        (
            "جزئیات دانلود",
            {"fields": ("coins_spent", "is_first_download", "downloaded_at")},
        ),
    )


@admin.register(QuestionLike)
class QuestionLikeAdmin(admin.ModelAdmin):
    list_display = ["user", "question", "created_at"]
    list_display_links = ["user", "question"]
    list_filter = ["created_at"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "question__title",
    ]
    ordering = ["-created_at"]
    raw_id_fields = ["user", "question"]

    fieldsets = (
        ("کاربر و سوال", {"fields": ("user", "question")}),
        ("زمان", {"fields": ("created_at",)}),
    )

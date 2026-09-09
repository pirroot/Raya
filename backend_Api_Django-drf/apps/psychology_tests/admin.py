from django.contrib import admin
import nested_admin
from .models import PsychologyTest, TestQuestion, TestOption, TestAttempt, TestAnswer


class TestOptionInline(nested_admin.NestedTabularInline):
    model = TestOption
    extra = 4
    fields = ["label", "is_correct"]
    min_num = 2
    max_num = 6
    ordering = ["id"]


class TestQuestionInline(nested_admin.NestedTabularInline):
    model = TestQuestion
    extra = 1
    fields = ["question", "order"]
    ordering = ["order"]
    inlines = [TestOptionInline]
    show_change_link = True


@admin.register(PsychologyTest)
class PsychologyTestAdmin(nested_admin.NestedModelAdmin):
    list_display = [
        "title",
        "category",
        "level",
        "price",
        "coin_price",
        "is_active",
        "questions_count",
        "created_at",
    ]
    list_display_links = ["title"]
    list_filter = ["category", "level", "is_active", "created_at"]
    search_fields = ["title", "description"]
    readonly_fields = [
        "questions_count",
        "rating",
        "reviews",
        "created_at",
        "updated_at",
    ]
    inlines = [TestQuestionInline]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("title", "description", "category", "image")}),
        ("قیمت", {"fields": ("price", "coin_price")}),
        ("جزئیات", {"fields": ("duration", "level", "rating", "reviews")}),
        ("تنظیمات", {"fields": ("is_active",)}),
        ("آمار", {"fields": ("questions_count",), "classes": ("collapse",)}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(TestQuestion)
class TestQuestionAdmin(admin.ModelAdmin):
    list_display = ["test", "question", "order"]
    list_display_links = ["question"]
    list_filter = ["test"]
    search_fields = ["question", "test__title"]
    ordering = ["test", "order"]
    inlines = [TestOptionInline]

    fieldsets = (("سوال", {"fields": ("test", "question", "order")}),)


@admin.register(TestOption)
class TestOptionAdmin(admin.ModelAdmin):
    list_display = ["question", "label", "is_correct"]
    list_display_links = ["label"]
    list_filter = ["is_correct", "question__test"]
    search_fields = ["label", "question__question"]
    ordering = ["question", "id"]

    fieldsets = (("گزینه", {"fields": ("question", "label", "is_correct")}),)


@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ["user", "test", "status", "score", "percentage", "started_at"]
    list_display_links = ["user", "test"]
    list_filter = ["status", "started_at", "test"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "test__title",
    ]
    readonly_fields = ["started_at", "completed_at", "score", "percentage"]
    raw_id_fields = ["user", "test"]
    ordering = ["-started_at"]

    fieldsets = (
        ("کاربر و تست", {"fields": ("user", "test")}),
        ("وضعیت", {"fields": ("status", "score", "percentage")}),
        ("زمان", {"fields": ("started_at", "completed_at"), "classes": ("collapse",)}),
    )


@admin.register(TestAnswer)
class TestAnswerAdmin(admin.ModelAdmin):
    list_display = ["attempt", "question", "selected_option", "is_correct"]
    list_display_links = ["attempt", "question"]
    list_filter = ["is_correct", "attempt__test"]
    search_fields = ["attempt__user__mobile", "question__question"]
    readonly_fields = ["is_correct"]
    raw_id_fields = ["attempt", "question", "selected_option"]

    fieldsets = (
        ("پاسخ", {"fields": ("attempt", "question", "selected_option", "is_correct")}),
    )

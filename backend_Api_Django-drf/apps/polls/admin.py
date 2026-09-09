from django.contrib import admin
from .models import Poll, PollOption, PollVote


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 2
    fields = ["label"]  # ✅ حذف order و votes_count
    # ordering = ["id"]  # ✅ حذف order


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ["title", "is_active", "starts_at", "ends_at", "total_votes"]
    list_display_links = ["title"]
    list_filter = ["is_active", "starts_at", "ends_at"]
    search_fields = ["title", "description"]
    readonly_fields = ["total_votes", "created_at", "updated_at"]
    inlines = [PollOptionInline]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات نظرسنجی", {"fields": ("title", "description")}),
        ("زمان‌بندی", {"fields": ("is_active", "starts_at", "ends_at")}),
        ("آمار", {"fields": ("total_votes",), "classes": ("collapse",)}),
        (
            "تاریخ‌ها",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ["label", "poll"]  # ✅ حذف order و votes_count
    list_display_links = ["label"]
    list_filter = ["poll"]
    search_fields = ["label", "poll__title"]
    # ordering = ["poll", "id"]  # ✅ حذف order

    fieldsets = (("گزینه", {"fields": ("poll", "label")}),)


@admin.register(PollVote)
class PollVoteAdmin(admin.ModelAdmin):
    list_display = ["user", "poll", "option", "created_at"]
    list_display_links = ["user", "poll"]
    list_filter = ["created_at", "poll"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "poll__title",
        "option__label",
    ]
    raw_id_fields = ["user", "poll", "option"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("اطلاعات رای", {"fields": ("user", "poll", "option")}),
        ("زمان", {"fields": ("created_at",)}),
    )

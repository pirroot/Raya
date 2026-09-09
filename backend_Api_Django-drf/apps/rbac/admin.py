from django.contrib import admin

from .models import Panel, Permission, Role, UserRole


@admin.register(Panel)
class PanelAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "host", "is_active"]
    list_display_links = ["code", "name"]
    list_filter = ["is_active"]
    search_fields = ["code", "name", "host"]
    ordering = ["code"]

    fieldsets = (("اطلاعات پنل", {"fields": ("code", "name", "host", "is_active")}),)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ["codename", "description"]
    list_display_links = ["codename"]
    search_fields = ["codename", "description"]
    ordering = ["codename"]

    fieldsets = (("مجوز", {"fields": ("codename", "description")}),)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["panel", "code", "name", "is_active"]
    list_display_links = ["code", "name"]
    list_filter = ["panel", "is_active"]
    filter_horizontal = ["permissions"]
    search_fields = ["code", "name", "panel__name"]
    ordering = ["panel", "code"]

    fieldsets = (
        ("اطلاعات نقش", {"fields": ("panel", "code", "name", "is_active")}),
        ("مجوزها", {"fields": ("permissions",)}),
    )


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "created_at"]
    list_display_links = ["user", "role"]
    list_filter = ["role", "created_at"]
    autocomplete_fields = ["user", "role"]
    search_fields = [
        "user__mobile",
        "user__first_name",
        "user__last_name",
        "role__name",
        "role__code",
    ]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]
    raw_id_fields = ["user"]

    fieldsets = (
        ("کاربر و نقش", {"fields": ("user", "role")}),
        ("زمان", {"fields": ("created_at",)}),
    )

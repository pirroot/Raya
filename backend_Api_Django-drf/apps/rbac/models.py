from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class Panel(BaseModel):
    """
    Represents a distinct application panel (e.g. main site, teacher panel).
    Roles are scoped to a panel so teacher.domain.ir can have its own
    role set without touching the main panel's roles.
    """

    code = models.SlugField(max_length=50, unique=True)  # e.g. "main", "teacher"
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=255, blank=True)  # e.g. teacher.domain.ir
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "rbac_panels"

    def __str__(self):
        return self.name


class Permission(BaseModel):
    """
    Fine-grained permission, e.g. codename "education.course.create".
    Deliberately app-agnostic (not django.contrib.auth.Permission) so it
    can be assigned flexibly across panels/roles.
    """

    codename = models.CharField(max_length=150, unique=True, db_index=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "rbac_permissions"

    def __str__(self):
        return self.codename


class Role(BaseModel):
    """A named set of permissions, scoped to a panel."""

    panel = models.ForeignKey(Panel, on_delete=models.CASCADE, related_name="roles")
    code = models.SlugField(max_length=50)  # e.g. "admin", "teacher", "student"
    name = models.CharField(max_length=100)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "rbac_roles"
        unique_together = ("panel", "code")
        indexes = [models.Index(fields=["panel", "code"])]

    def __str__(self):
        return f"{self.panel.code}:{self.code}"


class UserRole(BaseModel):
    """Assigns a role (within a panel) to a user."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")

    class Meta:
        db_table = "rbac_user_roles"
        unique_together = ("user", "role")
        indexes = [models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.user} -> {self.role}"

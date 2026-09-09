from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from apps.common.models import BaseModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, mobile: str, password: str | None, **extra_fields):
        if not mobile:
            raise ValueError("Mobile number is required.")
        user = self.model(mobile=mobile, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, mobile: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(mobile, password, **extra_fields)

    def create_superuser(
        self, mobile: str, password: str | None = None, **extra_fields
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("mobile_verified", True)
        return self._create_user(mobile, password, **extra_fields)


class User(BaseModel, AbstractBaseUser, PermissionsMixin):
    """
    Mobile-first custom user. Email is optional/secondary.
    Kept intentionally generic (no role field) — role & permission
    management lives entirely in the `rbac` app so panels (main/teacher)
    can be added without touching this model.
    """

    # ===== فیلدهای احراز هویت =====
    mobile = models.CharField(max_length=15, unique=True, db_index=True)
    mobile_verified = models.BooleanField(default=False)

    email = models.EmailField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    # ===== فیلدهای اطلاعات پایه =====
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True, default="")

    # ===== فیلدهای پروفایل =====
    avatar = models.ForeignKey(
        "storage.MediaFile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user_avatar",
    )
    birth_date = models.DateField(null=True, blank=True)

    # ===== فیلدهای تحصیلی =====
    student_code = models.CharField(max_length=50, blank=True, default="")
    education_level = models.CharField(
        max_length=20,
        blank=True,
        default="",
        choices=[
            ("diploma", "دیپلم"),
            ("associate", "کاردانی"),
            ("bachelor", "کارشناسی"),
            ("master", "کارشناسی ارشد"),
            ("phd", "دکتری"),
        ],
    )

    # ===== فیلدهای وضعیت =====
    status = models.CharField(
        max_length=20,
        default="online",
        choices=[
            ("online", "آنلاین"),
            ("offline", "آفلاین"),
            ("busy", "مشغول"),
            ("chill", "چیل"),
            ("studying", "در حال مطالعه"),
            ("gaming", "گیم"),
            ("coffee", "کافه"),
            ("music", "موزیک"),
            ("coding", "کد زدن"),
        ],
    )
    interests = models.JSONField(default=list, blank=True)  # لیست علاقه‌مندی‌ها

    # ===== فیلدهای سیستمی =====
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)  # استاد بودن

    last_login_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "mobile"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["mobile"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["username"]),
        ]

    def __str__(self):
        return f"{self.mobile} - {self.get_full_name()}"

    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.mobile

    def has_perm_code(self, code: str) -> bool:
        """Delegates to the rbac app to check a fine-grained permission code."""
        from apps.rbac.services import PermissionService

        return PermissionService(user=self).has_permission(code)


class OTPRequest(BaseModel):
    """Stores OTP requests for mobile login/registration, backed also by Redis TTL."""

    class Purpose(models.TextChoices):
        LOGIN = "login", "Login"
        REGISTER = "register", "Register"
        RESET_PASSWORD = "reset_password", "Reset Password"

    mobile = models.CharField(max_length=15, db_index=True)
    code_hash = models.CharField(max_length=255)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "otp_requests"
        indexes = [
            models.Index(fields=["mobile", "purpose"]),
        ]

    def __str__(self):
        return (
            f"{self.mobile} - {self.purpose} - {'used' if self.is_used else 'active'}"
        )

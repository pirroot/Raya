from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """
    اجازه دسترسی فقط برای کاربران ادمین (is_staff=True)
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsSuperUser(BasePermission):
    """
    اجازه دسترسی فقط برای سوپرادمین‌ها (is_superuser=True)
    """

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and request.user.is_superuser
        )


class IsOwnerOrAdmin(BasePermission):
    """
    اجازه دسترسی برای مالک یا ادمین
    """

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True

        # چک کردن مالکیت
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        if hasattr(obj, "created_by"):
            return obj.created_by == request.user

        return False


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    اجازه خواندن برای همه، نوشتن فقط برای کاربران احراز هویت شده
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class IsTeacherUser(BasePermission):
    """
    اجازه دسترسی فقط برای استادها (is_teacher=True)
    """

    def has_permission(self, request, view):
        return (
            request.user and request.user.is_authenticated and request.user.is_teacher
        )


class IsStudentUser(BasePermission):
    """
    اجازه دسترسی فقط برای دانشجوها (is_teacher=False)
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and not request.user.is_teacher
        )

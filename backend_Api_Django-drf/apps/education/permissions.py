from rest_framework import permissions


class IsTeacher(permissions.BasePermission):
    """فقط استادها"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_teacher


class IsCourseTeacher(permissions.BasePermission):
    """فقط استاد خود دوره"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_teacher

    def has_object_permission(self, request, view, obj):
        return obj.teacher == request.user


class IsEnrolled(permissions.BasePermission):
    """فقط کاربرانی که ثبت‌نام کردن"""

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return Enrollment.objects.filter(
            user=request.user, course=obj, status=Enrollment.Status.ACTIVE
        ).exists()

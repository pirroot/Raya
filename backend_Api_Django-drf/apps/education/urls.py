from django.urls import path
from .views import (
    CategoryListView,
    CourseListView,
    CourseDetailView,
    CourseCreateView,
    CourseUpdateView,
    CourseDeleteView,
    CourseEnrollView,
    CourseProgressView,
    MyCoursesView,
    CourseLessonsView,
    LessonCompleteView,
)

app_name = "education"

urlpatterns = [
    # Categories
    path("categories/", CategoryListView.as_view(), name="category-list"),
    # Courses
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/create/", CourseCreateView.as_view(), name="course-create"),
    path("courses/my/", MyCoursesView.as_view(), name="my-courses"),
    path("courses/<uuid:id>/", CourseDetailView.as_view(), name="course-detail"),
    path("courses/<uuid:id>/update/", CourseUpdateView.as_view(), name="course-update"),
    path("courses/<uuid:id>/delete/", CourseDeleteView.as_view(), name="course-delete"),
    path("courses/<uuid:id>/enroll/", CourseEnrollView.as_view(), name="course-enroll"),
    path(
        "courses/<uuid:id>/progress/",
        CourseProgressView.as_view(),
        name="course-progress",
    ),
    path(
        "courses/<uuid:id>/lessons/", CourseLessonsView.as_view(), name="course-lessons"
    ),
    path(
        "courses/<uuid:course_id>/lessons/<uuid:lesson_id>/complete/",
        LessonCompleteView.as_view(),
        name="lesson-complete",
    ),
]

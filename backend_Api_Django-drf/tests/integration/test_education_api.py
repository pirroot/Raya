import pytest
from rest_framework.test import APIClient

from apps.education.models import Category, Course
from apps.users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def teacher():
    return User.objects.create_user(mobile="09121111111", mobile_verified=True)


@pytest.fixture
def student():
    return User.objects.create_user(mobile="09122222222", mobile_verified=True)


@pytest.fixture
def course(teacher):
    category = Category.objects.create(name="Programming", slug="programming")
    return Course.objects.create(
        teacher=teacher,
        category=category,
        title="Django from Zero",
        slug="django-from-zero",
        status="published",
        price=0,
    )


class TestCourseListAPI:
    def test_list_published_courses_is_public(self, course):
        client = APIClient()
        response = client.get("/api/v1/education/courses/")

        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_enroll_requires_authentication(self, course):
        client = APIClient()
        response = client.post(f"/api/v1/education/courses/{course.id}/enroll/")

        assert response.status_code == 401

    def test_enroll_success(self, course, student):
        client = APIClient()
        client.force_authenticate(user=student)

        response = client.post(f"/api/v1/education/courses/{course.id}/enroll/")

        assert response.status_code == 201
        assert response.data["status"] == "active"

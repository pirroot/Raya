from rest_framework.routers import DefaultRouter

from .views import PanelViewSet, RoleViewSet

app_name = "rbac"

router = DefaultRouter()
router.register("panels", PanelViewSet, basename="panel")
router.register("roles", RoleViewSet, basename="role")

urlpatterns = router.urls

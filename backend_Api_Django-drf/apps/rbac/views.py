from rest_framework import permissions, viewsets

from .models import Panel, Role
from .serializers import PanelSerializer, RoleSerializer


class PanelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Panel.objects.filter(is_active=True)
    serializer_class = PanelSerializer
    permission_classes = [permissions.IsAuthenticated]


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.filter(is_active=True).prefetch_related("permissions")
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["panel"]

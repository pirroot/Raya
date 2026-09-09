from django.core.cache import cache

from apps.common.services import BaseService

from .models import UserRole

PERMISSION_CACHE_TTL = 300  # seconds
PERMISSION_CACHE_KEY = "rbac:user:{user_id}:permissions"


class PermissionService(BaseService):
    """
    Resolves the effective set of permission codenames for a user
    across all of their assigned roles, cached in Redis to keep
    permission checks fast on every request.
    """

    def _cache_key(self) -> str:
        return PERMISSION_CACHE_KEY.format(user_id=self.user.id)

    def get_permission_codes(self) -> set[str]:
        cached = cache.get(self._cache_key())
        if cached is not None:
            return cached

        codes = set(
            UserRole.objects.filter(user=self.user, role__is_active=True)
            .values_list("role__permissions__codename", flat=True)
            .distinct()
        )
        codes.discard(None)

        cache.set(self._cache_key(), codes, PERMISSION_CACHE_TTL)
        return codes

    def has_permission(self, codename: str) -> bool:
        return codename in self.get_permission_codes()

    def invalidate_cache(self) -> None:
        cache.delete(self._cache_key())

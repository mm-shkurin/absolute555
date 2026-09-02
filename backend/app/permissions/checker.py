from typing import Set, List
from app.core.exceptions import AuthorizationError
from app.features.account.models.users import Users
from .roles import UserRole
from .permissions import Permission
from .mapping import ROLE_PERMISSIONS

class PermissionChecker:
    def __init__(self, user: Users):
        self.user = user
        self._permissions_cache = None
    
    async def _get_permissions(self) -> Set[Permission]:
        if self._permissions_cache is None:
            self._permissions_cache = ROLE_PERMISSIONS.get(self.user.role, set())
        return self._permissions_cache
    
    async def can(self, permission: Permission) -> bool:
        permissions = await self._get_permissions()
        return permission in permissions
    
    async def assert_can(self, permission: Permission):
        if not await self.can(permission):
            raise AuthorizationError(
                "Permission denied",
                code="PERMISSION_DENIED",
                details={"required": permission.value},
            )
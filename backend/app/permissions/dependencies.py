"""Role and permission checks, and the FastAPI dependencies that enforce them.

Ownership lives in ownership.py and the guest limits in guests.py; what stays here
answers one question only -- does this caller's role carry this permission.
"""

from typing import List

from fastapi import Depends

from app.core.exceptions import AuthorizationError

from app.features.account.models.users import Users
from app.utils.security import get_current_user

from .mapping import ROLE_PERMISSIONS
from .permissions import Permission
from .roles import UserRole

async def get_user_permissions(user_role: UserRole) -> set[Permission]:
    return ROLE_PERMISSIONS.get(user_role, set())

async def has_permission(user_role: UserRole, permission: Permission) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return permission in user_permissions

async def has_any_permission(user_role: UserRole, permissions: List[Permission]) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return any(perm in user_permissions for perm in permissions)

async def has_all_permissions(user_role: UserRole, permissions: List[Permission]) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return all(perm in user_permissions for perm in permissions)

def require_permission(permission: Permission):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise AuthorizationError("Invalid user role", code="ROLE_UNKNOWN")
        if not await has_permission(user_role, permission):
            raise AuthorizationError(
                "Permission denied",
                code="PERMISSION_DENIED",
                details={"required": permission.value},
            )
        return current_user
    return permission_checker

def require_any_permission(permissions: List[Permission]):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise AuthorizationError("Invalid user role", code="ROLE_UNKNOWN")
        if not await has_any_permission(user_role, permissions):
            raise AuthorizationError(
                "Permission denied",
                code="PERMISSION_DENIED",
                details={"required": [p.value for p in permissions]},
            )
        return current_user
    return permission_checker

def require_all_permissions(permissions: List[Permission]):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise AuthorizationError("Invalid user role", code="ROLE_UNKNOWN")
        if not await has_all_permissions(user_role, permissions):
            raise AuthorizationError(
                "Permission denied",
                code="PERMISSION_DENIED",
                details={"required": [p.value for p in permissions]},
            )
        return current_user
    return permission_checker

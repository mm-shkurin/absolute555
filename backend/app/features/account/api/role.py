from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.account.models.users import Users
from app.features.account.schemas.role import (
    UserRoleUpdate,
    UserRoleInfo,
    UserListResponse,
    RoleStats,
)
from app.core.exceptions import BusinessRuleError, ResourceNotFoundError
from app.features.account.services.role_service import RoleService
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole
from loguru import logger

role_router = APIRouter()

@role_router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
    role_filter: Optional[UserRole] = Query(None, description="Фильтр по роли"),
    current_user: Users = Depends(require_permission(Permission.VIEW_USERS)),
    db: AsyncSession = Depends(get_db)
):
    service = RoleService(db)
    users = await service.get_all_users(role_filter)
    
    result = []
    for user in users:
        name = "Неизвестный пользователь"
        platform = None
        
        if user.vk_json and isinstance(user.vk_json, dict):
            first_name = user.vk_json.get('first_name', '')
            last_name = user.vk_json.get('last_name', '')
            name = f"{first_name} {last_name}".strip()
            platform = "vk"
        elif user.yandex_json and isinstance(user.yandex_json, dict):
            first_name = user.yandex_json.get('first_name', '')
            last_name = user.yandex_json.get('last_name', '')
            name = f"{first_name} {last_name}".strip()
            platform = "yandex"
        
        result.append(UserListResponse(
            id=user.id,
            role=user.role,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat() if user.created_at else "",
            name=name,
            platform=platform
        ))
    
    return result

@role_router.put("/users/{user_id}/role", response_model=dict)
async def update_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    current_user: Users = Depends(require_permission(Permission.MANAGE_ALL_USERS)),
    db: AsyncSession = Depends(get_db)
):

    service = RoleService(db)
    user = await service.update_user_role(user_id, role_data.new_role)
    
    if not user:
        raise ResourceNotFoundError("Пользователь не найден", code="USER_NOT_FOUND")
    
    logger.info(f"User {user_id} role updated to {role_data.new_role.value} by {current_user.id}. Reason: {role_data.reason}")
    
    return {
        "message": "Роль успешно обновлена", 
        "user_id": user_id, 
        "new_role": role_data.new_role.value,
        "reason": role_data.reason,
        "note": "Все pending запросы на смену роли автоматически обновлены"
    }

@role_router.get("/users/{user_id}/role-info", response_model=UserRoleInfo)
async def get_user_role_info(
    user_id: UUID,
    current_user: Users = Depends(require_permission(Permission.VIEW_USERS)),
    db: AsyncSession = Depends(get_db)
):
    service = RoleService(db)
    user = await service.get_user_by_id(user_id)
    
    if not user:
        raise ResourceNotFoundError("Пользователь не найден", code="USER_NOT_FOUND")
    
    return UserRoleInfo(
        user_id=user.id,
        current_role=user.role,
        is_verified=user.is_verified
    )

@role_router.get("/stats", response_model=RoleStats)
async def get_role_stats(
    current_user: Users = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    service = RoleService(db)
    stats = await service.get_role_stats()
    
    return RoleStats(
        total_users=stats["total_users"],
        users_by_role=stats["users_by_role"],
        verified_users=stats["verified_users"],
        unverified_users=stats["unverified_users"]
    )

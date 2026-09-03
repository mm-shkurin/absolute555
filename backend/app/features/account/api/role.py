from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.account.api.admin_console import list_people
from app.features.account.schemas.admin import UserPage
from app.features.account.schemas.role import (
    UserRoleUpdate,
    UserRoleInfo,
    RoleStats,
)
from app.features.account.services.account_access_service import AccountAccessService
from app.core.exceptions import BusinessRuleError, ResourceNotFoundError
from app.features.account.services.role_service import RoleService
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole
from loguru import logger

role_router = APIRouter()

@role_router.get("/users", response_model=UserPage)
async def get_all_users(
    query: Optional[str] = Query(None, description="Поиск по имени"),
    role_filter: Optional[UserRole] = Query(None, alias="role", description="Фильтр по роли"),
    blocked: Optional[bool] = Query(None, description="Только закрытые или только открытые"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_permission(Permission.VIEW_USERS)),
    db: AsyncSession = Depends(get_db),
):
    """Страница списка.

    Прежняя форма отдавала всю таблицу одним массивом и собирала вид прямо здесь. При
    плановых тысячах учётных записей это ответ на всю базу ради одного экрана.
    """
    return await list_people(
        query, role_filter.value if role_filter else None, blocked, page, page_size, db
    )


@role_router.put("/users/{user_id}/role", response_model=dict)
async def update_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    current_user=Depends(require_permission(Permission.MANAGE_ALL_USERS)),
    db: AsyncSession = Depends(get_db)
):

    service = RoleService(db)
    was = await service.get_user_by_id(user_id)
    if not was:
        raise ResourceNotFoundError("Пользователь не найден", code="USER_NOT_FOUND")
    previous_role = was.role

    user = await service.update_user_role(user_id, role_data.new_role)
    if not user:
        raise ResourceNotFoundError("Пользователь не найден", code="USER_NOT_FOUND")

    # Причина принималась и уходила в лог контейнера, где жила до перезапуска. Теперь
    # она в журнале — там, где её ищут, когда спрашивают «на каком основании».
    await AccountAccessService(db).record_role_change(
        user, current_user, role_data.reason, previous_role, role_data.new_role.value
    )
    
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
    current_user=Depends(require_permission(Permission.VIEW_USERS)),
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
    current_user=Depends(require_permission(Permission.VIEW_ANALYTICS)),
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

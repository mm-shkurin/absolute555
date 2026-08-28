from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.users import Users
from app.schemas.role import (
    UserRoleUpdate,
    UserRoleInfo,
    UserListResponse,
    RoleStats,
    RoleRequestCreate,
    RoleRequestResponse,
    RoleRequestListResponse,
    RoleRequestUpdate
)
from app.services.role_service import RoleService
from app.services.role_request_service import RoleRequestService
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    
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

@role_router.post("/role-request", response_model=RoleRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_role_request(
    request_data: RoleRequestCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        service = RoleRequestService(db)
        role_request = await service.create_role_request(current_user.id, request_data)
        
        return RoleRequestResponse.from_orm(role_request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating role request: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ошибка при создании заявки")

@role_router.get("/my-role-requests", response_model=List[RoleRequestResponse])
async def get_my_role_requests(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = RoleRequestService(db)
    role_requests = await service.get_user_role_requests(current_user.id)
    
    return [RoleRequestResponse.from_orm(req) for req in role_requests]

@role_router.get("/role-requests", response_model=List[RoleRequestListResponse])
async def get_all_role_requests(
    status: Optional[str] = Query(None, description="Фильтр по статусу: pending, approved, rejected"),
    current_user: Users = Depends(require_permission(Permission.VIEW_ROLE_REQUESTS)),
    db: AsyncSession = Depends(get_db)
):
    service = RoleRequestService(db)
    role_requests = await service.get_all_role_requests(status)
    
    result = []
    for req in role_requests:
        user_name = "Неизвестный пользователь"
        if req.user:
            user_name = service._get_user_name(req.user)
        
        result.append(RoleRequestListResponse(
            id=req.id,
            user_id=req.user_id,
            user_name=user_name,
            requested_role=UserRole(req.requested_role),
            reason=req.reason,
            status=req.status,
            created_at=req.created_at
        ))
    
    return result

@role_router.put("/role-requests/{request_id}", response_model=RoleRequestResponse)
async def update_role_request(
    request_id: str,
    update_data: RoleRequestUpdate,
    current_user: Users = Depends(require_permission(Permission.MANAGE_ROLE_REQUESTS)),
    db: AsyncSession = Depends(get_db)
):
    service = RoleRequestService(db)
    role_request = await service.update_role_request(request_id, current_user.id, update_data)
    
    if not role_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")
    
    return RoleRequestResponse.from_orm(role_request)

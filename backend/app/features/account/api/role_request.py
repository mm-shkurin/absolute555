"""Заявка на роль: подать, посмотреть свои, разобрать очередь, решить.

Отделено от `role.py`, когда тот упёрся в лимит: роль человека и заявка на её смену —
два разных предмета, и правила у них разные.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.account.api.role_http import to_http
from app.features.account.schemas.role import (
    RoleRequestCreate,
    RoleRequestListResponse,
    RoleRequestResponse,
    RoleRequestUpdate,
)
from app.features.account.services.role_errors import RoleRequestError
from app.features.account.services.role_request_service import RoleRequestService
from app.permissions.dependencies import require_permission
from app.permissions.guests import forbid_guest
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole
from app.utils.security import get_current_user

role_request_router = APIRouter()


@role_request_router.post(
    "/role-request", response_model=RoleRequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_role_request(
    request_data: RoleRequestCreate,
    current_user=Depends(forbid_guest),
    db: AsyncSession = Depends(get_db),
):
    """Гость заявок не подаёт: у него нет ни профиля, ни того, что роль открывает."""
    try:
        role_request = await RoleRequestService(db).create_role_request(
            current_user.id, request_data
        )
    except RoleRequestError as error:
        raise to_http(error)
    return RoleRequestResponse.from_orm(role_request)


@role_request_router.get("/my-role-requests", response_model=List[RoleRequestResponse])
async def get_my_role_requests(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    requests = await RoleRequestService(db).get_user_role_requests(current_user.id)
    return [RoleRequestResponse.from_orm(request) for request in requests]


@role_request_router.get("/role-requests", response_model=List[RoleRequestListResponse])
async def get_all_role_requests(
    status: Optional[str] = Query(None, description="pending, approved или rejected"),
    current_user=Depends(require_permission(Permission.VIEW_ROLE_REQUESTS)),
    db: AsyncSession = Depends(get_db),
):
    service = RoleRequestService(db)
    requests = await service.get_all_role_requests(status)
    return [
        RoleRequestListResponse(
            id=request.id,
            user_id=request.user_id,
            user_name=service.name_of(request.user),
            requested_role=UserRole(request.requested_role),
            reason=request.reason,
            status=request.status,
            created_at=request.created_at,
        )
        for request in requests
    ]


@role_request_router.put("/role-requests/{request_id}", response_model=RoleRequestResponse)
async def decide_role_request(
    request_id: str,
    update_data: RoleRequestUpdate,
    current_user=Depends(require_permission(Permission.MANAGE_ROLE_REQUESTS)),
    db: AsyncSession = Depends(get_db),
):
    """Одобрение выдаёт роль в той же транзакции, что меняет статус заявки."""
    try:
        role_request = await RoleRequestService(db).decide(request_id, current_user, update_data)
    except RoleRequestError as error:
        raise to_http(error)
    return RoleRequestResponse.from_orm(role_request)

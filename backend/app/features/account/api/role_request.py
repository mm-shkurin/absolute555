"""Заявка на роль: подать, посмотреть свои, разобрать очередь, решить.

Отделено от `role.py`, когда тот упёрся в лимит: роль человека и заявка на её смену —
два разных предмета, и правила у них разные.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.features.account.deps import get_role_request_service
from app.features.account.schemas.role import (
    RoleRequestCreate,
    RoleRequestListResponse,
    RoleRequestResponse,
    RoleRequestUpdate,
)
from app.features.account.services.role_request_service import (
    RoleRequestService,
    RoleRequestStatus,
)
from app.permissions.dependencies import require_permission
from app.permissions.guests import forbid_guest
from app.permissions.permissions import Permission
from app.permissions.roles import UserRole
from app.features.auth.deps import get_current_user

role_request_router = APIRouter()


@role_request_router.post(
    "/role-request", response_model=RoleRequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_role_request(
    request_data: RoleRequestCreate,
    current_user=Depends(forbid_guest),
    role_request_service: RoleRequestService = Depends(get_role_request_service),
):
    """Гость заявок не подаёт: у него нет ни профиля, ни того, что роль открывает."""
    role_request = await role_request_service.create_role_request(current_user.id, request_data)
    return RoleRequestResponse.from_orm(role_request)


@role_request_router.get("/my-role-requests", response_model=List[RoleRequestResponse])
async def get_my_role_requests(
    current_user=Depends(get_current_user),
    role_request_service: RoleRequestService = Depends(get_role_request_service),
):
    requests = await role_request_service.get_user_role_requests(current_user.id)
    return [RoleRequestResponse.from_orm(request) for request in requests]


@role_request_router.get("/role-requests", response_model=List[RoleRequestListResponse])
async def get_all_role_requests(
    status: Optional[RoleRequestStatus] = Query(None),
    current_user=Depends(require_permission(Permission.VIEW_ROLE_REQUESTS)),
    role_request_service: RoleRequestService = Depends(get_role_request_service),
):
    requests = await role_request_service.get_all_role_requests(status)
    return [
        RoleRequestListResponse(
            id=request.id,
            user_id=request.user_id,
            user_name=role_request_service.name_of(request.user),
            requested_role=UserRole(request.requested_role),
            reason=request.reason,
            status=request.status,
            created_at=request.created_at,
        )
        for request in requests
    ]


@role_request_router.put("/role-requests/{request_id}", response_model=RoleRequestResponse)
async def decide_role_request(
    request_id: UUID,
    update_data: RoleRequestUpdate,
    current_user=Depends(require_permission(Permission.MANAGE_ROLE_REQUESTS)),
    role_request_service: RoleRequestService = Depends(get_role_request_service),
):
    """Одобрение выдаёт роль в той же транзакции, что меняет статус заявки."""
    role_request = await role_request_service.decide(request_id, current_user, update_data)
    return RoleRequestResponse.from_orm(role_request)

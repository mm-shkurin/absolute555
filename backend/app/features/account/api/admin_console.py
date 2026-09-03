"""Консоль: люди, карточка, журнал, блокировка.

Отдельно от `role.py` — тот про роли и заявки, здесь про учётные записи. Границу видно
и в правах: список, карточку и блокировку открывает `manager`, журнал — только `admin`.

Роутер переводит доменный отказ в статус и ничего не решает сам: правила живут в
сервисе, потому что решение «модератор не трогает равного» одинаково и для HTTP, и для
всего, что позовёт сервис потом.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, ConflictError, ResourceNotFoundError
from app.db.database import get_db
from app.features.account.api.admin_view import access_of, audit_of, card_of, page_of
from app.features.account.schemas.admin import (
    AccessChange,
    AuditEntry,
    UserAccess,
    UserCard,
    UserPage,
)
from app.features.account.services.account_access_service import (
    AccountAccessService,
    AccountMissing,
    AccessConflict,
    AccessRefused,
)
from app.features.account.services.people_service import PeopleService
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission

admin_router = APIRouter()


@admin_router.get("/users/{user_id}", response_model=UserCard)
async def read_user_card(
    user_id: UUID,
    _=Depends(require_permission(Permission.VIEW_USERS)),
    db: AsyncSession = Depends(get_db),
):
    found = await PeopleService(db).card(user_id)
    if found is None:
        raise ResourceNotFoundError("Пользователь не найден", code="USER_NOT_FOUND")
    return card_of(*found)


@admin_router.get("/users/{user_id}/audit", response_model=List[AuditEntry])
async def read_user_audit(
    user_id: UUID,
    _=Depends(require_permission(Permission.VIEW_ACCOUNT_AUDIT)),
    db: AsyncSession = Depends(get_db),
):
    """Журнал только читается: запись, которую можно подчистить, ничего не доказывает."""
    return audit_of(await AccountAccessService(db).journal(user_id))


@admin_router.post("/users/{user_id}/block", response_model=UserAccess)
async def block_user(
    user_id: UUID,
    change: AccessChange,
    actor=Depends(require_permission(Permission.BLOCK_USERS)),
    db: AsyncSession = Depends(get_db),
):
    return access_of(await _apply(AccountAccessService(db).block, user_id, actor, change))


@admin_router.post("/users/{user_id}/unblock", response_model=UserAccess)
async def unblock_user(
    user_id: UUID,
    change: AccessChange,
    actor=Depends(require_permission(Permission.BLOCK_USERS)),
    db: AsyncSession = Depends(get_db),
):
    return access_of(await _apply(AccountAccessService(db).unblock, user_id, actor, change))


async def _apply(action, user_id: UUID, actor, change: AccessChange):
    try:
        return await action(user_id, actor, change.reason)
    except AccountMissing as missing:
        raise ResourceNotFoundError(str(missing), code="USER_NOT_FOUND") from missing
    except AccessRefused as refused:
        raise AuthorizationError(str(refused), code="PERMISSION_DENIED") from refused
    except AccessConflict as conflict:
        raise ConflictError(str(conflict), code="ACCESS_UNCHANGED") from conflict


async def list_people(
    query: Optional[str],
    role: Optional[str],
    blocked: Optional[bool],
    page: int,
    page_size: int,
    db: AsyncSession,
) -> UserPage:
    """Страница списка. Вызывается из `role.py`, где маршрут `/users` живёт с самого
    начала: переносить путь ради красоты значило бы сломать всех, кто его уже зовёт."""
    return page_of(*await PeopleService(db).page(query, role, blocked, page, page_size))

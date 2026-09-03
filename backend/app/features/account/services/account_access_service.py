"""Закрыть и вернуть доступ, и записать, кто это сделал.

Запись журнала пишется в той же транзакции, что и само действие. Иначе бывает
блокировка без записи о ней — и тогда по журналу уже нельзя судить, что происходило,
а именно за этим он и заводится.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.account.models.account_audit import (
    BLOCKED,
    ROLE_CHANGED,
    UNBLOCKED,
    AccountAudit,
)
from app.features.account.models.users import Users
from app.permissions.roles import UserRole

# Роли, над которыми модератор не властен. Власть над равным — тот же тихий путь наверх,
# который история 13 закрыла у заявок на роль.
PROTECTED_FROM_MODERATOR = {UserRole.MANAGER.value, UserRole.ADMIN.value}


class AccessRefused(Exception):
    """Действие запрещено этому исполнителю."""


class AccessConflict(Exception):
    """Доступ уже в том состоянии, которого просят, или цель — сам исполнитель."""


class AccountMissing(Exception):
    """Такой учётной записи нет."""


class AccountAccessService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def block(self, user_id: UUID, actor: Users, reason: str) -> Users:
        user = await self._target(user_id, actor)
        if user.deleted_at is not None:
            # Дверь уже закрыта. Запись в журнале о блокировке ушедшего создавала бы
            # видимость действия, которого не было.
            raise AccessConflict("Учётная запись удалена владельцем")
        if user.is_blocked:
            # Не «успех, ничего не делаю»: экран показал бы состоявшимся второе
            # действие, которого нет в журнале.
            raise AccessConflict("Доступ уже закрыт")
        user.is_blocked = True
        user.blocked_reason = reason
        user.blocked_at = datetime.utcnow()
        return await self._record(user, actor, BLOCKED, reason)

    async def unblock(self, user_id: UUID, actor: Users, reason: str) -> Users:
        user = await self._target(user_id, actor)
        if not user.is_blocked:
            raise AccessConflict("Доступ и так открыт")
        user.is_blocked = False
        user.blocked_reason = None
        user.blocked_at = None
        return await self._record(user, actor, UNBLOCKED, reason)

    async def record_role_change(
        self, user: Users, actor: Users, reason: str, was: str, now: str
    ) -> None:
        self.db.add(
            AccountAudit.of(user.id, actor.id, ROLE_CHANGED, reason, details=f"{was} → {now}")
        )
        await self.db.commit()

    async def journal(self, user_id: UUID) -> List[tuple]:
        """Записи и имена исполнителей, новые первыми."""
        result = await self.db.execute(
            select(AccountAudit, Users)
            .join(Users, Users.id == AccountAudit.actor_id)
            .where(AccountAudit.user_id == user_id)
            .order_by(desc(AccountAudit.created_at))
        )
        return list(result.all())

    async def _target(self, user_id: UUID, actor: Users) -> Users:
        if user_id == actor.id:
            # Первый же промах иначе оставляет площадку без администратора, и вернуть
            # доступ будет некому.
            raise AccessConflict("Себя заблокировать нельзя")
        user = await self._by_id(user_id)
        if user is None:
            raise AccountMissing("Пользователь не найден")
        if actor.role != UserRole.ADMIN.value and user.role in PROTECTED_FROM_MODERATOR:
            raise AccessRefused("Модератор не закрывает доступ равному и старшему")
        return user

    async def _by_id(self, user_id: UUID) -> Optional[Users]:
        result = await self.db.execute(select(Users).where(Users.id == user_id))
        return result.scalar_one_or_none()

    async def _record(self, user: Users, actor: Users, action: str, reason: str) -> Users:
        self.db.add(AccountAudit.of(user.id, actor.id, action, reason))
        await self.db.commit()
        await self.db.refresh(user)
        return user

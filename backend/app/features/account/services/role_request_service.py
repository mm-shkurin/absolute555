"""Role requests: a user asking to become a manager or an importer.

Split out of RoleService when that file passed the 200-line limit. The two are separate
subjects -- one is the role a user has, the other is the application to change it -- and
the router constructs whichever it needs.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.account.models.role_request import RoleRequest, RoleRequestStatus
from app.features.account.models.users import Users
from app.permissions.roles import UserRole
from app.features.account.schemas.role import RoleRequestCreate, RoleRequestUpdate
from app.features.account.services.role_errors import (
    CannotGrantRole,
    DuplicateLiveRequest,
    RejectionWithoutReason,
    RequestAlreadyDecided,
    RoleAlreadyHeld,
    RoleRequestNotFound,
)

# Что модератор вправе выдать. Всё, что выше, — только администратор: запросить admin
# может любой, и без этой границы «рассмотреть заявку» становится дорогой наверх.
MANAGER_MAY_GRANT = frozenset({UserRole.USER.value, UserRole.IMPORTER.value})


def _may_grant(reviewer: Users, role: str) -> bool:
    """Администратор выдаёт любую роль, модератор — только ниже своей."""
    if reviewer.role == UserRole.ADMIN.value:
        return True
    return role in MANAGER_MAY_GRANT


class RoleRequestService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, id: UUID) -> Optional[Users]:
        """The applicant. Left behind in RoleService when this class was split out of it,
        which made both call sites below raise AttributeError -- every application, and
        every approval of one."""
        result = await self.db.execute(select(Users).where(Users.id == id))
        return result.scalar_one_or_none()

    async def create_role_request(self, user_id: UUID, request_data: RoleRequestCreate) -> RoleRequest:

        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("Пользователь не найден")

        requested = request_data.requested_role.value
        if user.role == requested:
            # Не «успех, ничего не делаю»: экран показал бы заявку, которую никто
            # никогда не рассмотрит.
            raise RoleAlreadyHeld(requested)

        existing_request = await self.db.execute(
            select(RoleRequest).where(
                RoleRequest.user_id == user_id,
                RoleRequest.requested_role == requested,
                RoleRequest.status == RoleRequestStatus.PENDING.value,
            )
        )
        if existing_request.scalar_one_or_none():
            raise DuplicateLiveRequest(requested)

        now = datetime.now()
        role_request = RoleRequest(
            user_id=user_id,
            requested_role=requested,
            reason=request_data.reason,
            additional_info=request_data.additional_info,
            status=RoleRequestStatus.PENDING.value,
            created_at=now,
            updated_at=now,
        )

        self.db.add(role_request)
        await self.db.commit()
        await self.db.refresh(role_request)

        logger.info(f"Role request created for user {user_id}, role: {requested}")

        return role_request

    async def get_user_role_requests(self, user_id: UUID) -> List[RoleRequest]:
        result = await self.db.execute(
            select(RoleRequest).where(RoleRequest.user_id == user_id).order_by(desc(RoleRequest.created_at))
        )
        return list(result.scalars().all())

    async def get_all_role_requests(self, status: Optional[str] = None) -> List[RoleRequest]:

        from sqlalchemy.orm import selectinload
        
        query = select(RoleRequest).options(selectinload(RoleRequest.user)).order_by(desc(RoleRequest.created_at))
        
        if status:
            query = query.where(RoleRequest.status == status)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def decide(self, request_id: str, reviewer: Users, update_data: RoleRequestUpdate) -> RoleRequest:
        """Решение по заявке, вместе с выдачей роли.

        Одна транзакция на оба действия: иначе бывает одобренная заявка без выданной
        роли, и по журналу заявок уже нельзя судить о том, у кого какая роль.
        """
        result = await self.db.execute(select(RoleRequest).where(RoleRequest.id == request_id))
        role_request = result.scalar_one_or_none()

        if not role_request:
            raise RoleRequestNotFound(request_id)

        if role_request.status != RoleRequestStatus.PENDING.value:
            raise RequestAlreadyDecided(role_request.status)

        approving = update_data.status == RoleRequestStatus.APPROVED.value
        if not approving and not (update_data.review_comment or "").strip():
            raise RejectionWithoutReason()

        if approving and not _may_grant(reviewer, role_request.requested_role):
            raise CannotGrantRole(role_request.requested_role)

        role_request.status = update_data.status
        role_request.reviewed_by = reviewer.id
        role_request.reviewed_at = datetime.now()
        role_request.review_comment = update_data.review_comment

        if approving:
            user = await self.get_user_by_id(role_request.user_id)
            if user:
                user.role = role_request.requested_role
                logger.info(f"User {user.id} role updated to {role_request.requested_role}")

        await self.db.commit()
        await self.db.refresh(role_request)

        logger.info(f"Role request {request_id} updated to status: {update_data.status}")
        return role_request

    def name_of(self, user: Users) -> str:
        return user.display_name if user is not None else "Неизвестный пользователь"

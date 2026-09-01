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
        
        existing_request = await self.db.execute(
            select(RoleRequest).where(
                RoleRequest.user_id == user_id,
                RoleRequest.requested_role == request_data.requested_role.value,
                RoleRequest.status == RoleRequestStatus.PENDING
            )
        )
        if existing_request.scalar_one_or_none():
            raise ValueError("У вас уже есть активная заявка на эту роль")
        
        now = datetime.now()
        role_request = RoleRequest(
            user_id=user_id,
            requested_role=request_data.requested_role.value,
            reason=request_data.reason,
            additional_info=request_data.additional_info,
            status=RoleRequestStatus.PENDING,
            created_at=now,
            updated_at=now
        )
        
        self.db.add(role_request)
        await self.db.commit()
        await self.db.refresh(role_request)
        
        logger.info(f"Role request created for user {user_id}, role: {request_data.requested_role.value}")
        
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

    async def update_role_request(self, request_id: str, reviewer_id: UUID, update_data: RoleRequestUpdate) -> Optional[RoleRequest]:
   
        result = await self.db.execute(
            select(RoleRequest).where(RoleRequest.id == request_id)
        )
        role_request = result.scalar_one_or_none()
        
        if not role_request:
            return None
        
        role_request.status = update_data.status
        role_request.reviewed_by = reviewer_id
        role_request.reviewed_at = datetime.now()
        role_request.review_comment = update_data.review_comment
        
        if update_data.status == RoleRequestStatus.APPROVED:
            user = await self.get_user_by_id(role_request.user_id)
            if user:
                user.role = role_request.requested_role
                logger.info(f"User {user.id} role updated to {role_request.requested_role}")
        
        await self.db.commit()
        await self.db.refresh(role_request)
        
        logger.info(f"Role request {request_id} updated to status: {update_data.status}")
        return role_request

    def _get_user_name(self, user: Users) -> str:
        if user.vk_json and isinstance(user.vk_json, dict):
            first_name = user.vk_json.get('first_name', '')
            last_name = user.vk_json.get('last_name', '')
            return f"{first_name} {last_name}".strip()
        elif user.yandex_json and isinstance(user.yandex_json, dict):
            first_name = user.yandex_json.get('first_name', '')
            last_name = user.yandex_json.get('last_name', '')
            return f"{first_name} {last_name}".strip()
        
        return "Неизвестный пользователь"

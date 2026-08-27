from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import json

from app.models.users import Users
from app.models.role_request import RoleRequest, RoleRequestStatus
from app.permissions.roles import UserRole
from app.permissions.checker import PermissionChecker
from app.permissions.permissions import Permission
from app.schemas.role import RoleRequestCreate, RoleRequestUpdate
from loguru import logger

class RoleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_users(self, role_filter: Optional[UserRole] = None) -> List[Users]:
        query = select(Users).order_by(desc(Users.created_at))
        
        if role_filter:
            query = query.where(Users.role == role_filter.value)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_role_stats(self) -> dict:
        total_result = await self.db.execute(select(Users))
        total_users = len(list(total_result.scalars().all()))
        
        users_by_role = {}
        for role in UserRole:
            role_result = await self.db.execute(
                select(Users).where(Users.role == role.value)
            )
            users_by_role[role.value] = len(list(role_result.scalars().all()))
        
        verified_result = await self.db.execute(
            select(Users).where(Users.is_verified == True)
        )
        verified_users = len(list(verified_result.scalars().all()))
        
        unverified_users = total_users - verified_users
        
        return {
            "total_users": total_users,
            "users_by_role": users_by_role,
            "verified_users": verified_users,
            "unverified_users": unverified_users
        }

    async def get_user_by_id(self, id: UUID) -> Optional[Users]:
        result = await self.db.execute(select(Users).where(Users.id == id))
        return result.scalar_one_or_none()

    async def update_user_role(self, id: UUID, new_role: UserRole) -> Optional[Users]:
        user = await self.get_user_by_id(id)
        if user:
            user.role = new_role.value
            
            all_pending_requests = await self.db.execute(
                select(RoleRequest).where(
                    RoleRequest.user_id == id,
                    RoleRequest.status == RoleRequestStatus.PENDING
                )
            )
            
            for request in all_pending_requests.scalars().all():
                if request.requested_role == new_role.value:
                    request.status = RoleRequestStatus.APPROVED
                    request.review_comment = "Роль выдана администратором"
                    logger.info(f"Role request {request.id} auto-approved for user {id}")
                else:
                    request.status = RoleRequestStatus.REJECTED
                    request.review_comment = "Роль изменена на другую"
                    logger.info(f"Role request {request.id} auto-rejected for user {id}")
                
                request.reviewed_at = datetime.now()
                
            await self.db.commit()
            await self.db.refresh(user)
        return user

    async def get_users_by_role(self, role: UserRole) -> List[Users]:
        result = await self.db.execute(select(Users).where(Users.role == role.value))
        return list(result.scalars().all())

    async def check_user_permissions(self, user: Users, permission: Permission) -> bool:
        checker = PermissionChecker(user)
        return await checker.can(permission)

    async def get_user_permissions(self, user: Users) -> List[Permission]:
        checker = PermissionChecker(user)
        permissions = await checker._get_permissions()
        return list(permissions)

    async def can_user_manage_other_user(self, current_user: Users, target_user: Users) -> bool:

        if current_user.role == UserRole.ADMIN.value:
            return True
        
        # OWNER used to sit above ADMIN here and SERVICE_OWNER was what a MANAGER could
        # manage; both roles went with story 1, leaving MANAGER over plain users.
        if current_user.role == UserRole.MANAGER.value:
            return target_user.role == UserRole.USER.value
        
        return current_user.id == target_user.id

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

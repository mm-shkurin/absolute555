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

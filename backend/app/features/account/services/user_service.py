from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from app.features.account.models.users import Users
from app.permissions.roles import UserRole
from datetime import datetime
from loguru import logger

from uuid import UUID
from app.features.listing.models.sale_car import SaleCars

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_get_yandex_user(self, yandex_id: str, yandex_json: dict):
        logger.info(f"Looking for user with yandex_id: {yandex_id}")
        logger.debug("yandex_json received")
        exists = await self.db.execute(select(Users).where(Users.yandex_id == yandex_id))
        user = exists.scalar_one_or_none()
    
        logger.debug(f"Looking for user with yandex_id again: {yandex_id}")
        if not user:
            logger.info("Creating new user (yandex)")
            new_user = Users(yandex_id=yandex_id, yandex_json=yandex_json, role=UserRole.USER.value, is_verified=False)
            self.db.add(new_user)
            await self.db.commit()
            await self.db.refresh(new_user)
            logger.info(f"New user created with id: {new_user.id}")
            return new_user.id
        else:
            logger.info(f"Updating existing user: {user.id}")
            user.yandex_json = yandex_json
            await self.db.commit()
            logger.debug("User yandex_json updated")
            return user.id

    async def create_or_get_vk_user(self, vk_id: str, vk_json: dict):
        logger.info(f"Looking for user with vk_id: {vk_id}")
        logger.debug("vk_json received")
        exists = await self.db.execute(select(Users).where(Users.vk_id == vk_id))
        user = exists.scalar_one_or_none()

        logger.debug(f"Looking for user with vk_id again: {vk_id}")
        if not user:
            logger.info("Creating new user (vk)")
            new_user = Users(vk_id=vk_id, vk_json=vk_json, role=UserRole.USER.value, is_verified=False)
            self.db.add(new_user)
            await self.db.commit()
            await self.db.refresh(new_user)
            logger.info(f"New user created with id: {new_user.id}")
            return new_user.id
        else:
            logger.info(f"Updating existing user: {user.id}")
            user.vk_json = vk_json
            await self.db.commit()
            logger.debug("User vk_json updated")
            return user.id
    
    async def create_or_get_guest_user(self, device_id: Optional[str] = None):
        if device_id :
            result = await self.db.execute(
                select(Users).where(
                    Users.device_id == device_id,
                    Users.is_guest == True
                )
            )
        user = result.scalar_one_or_none()
    
        if not user:
            guest_json = {
                "device_id":device_id,
                "username":"Гость",
            }

            user = Users(
                device_id =  device_id,
                is_guest = True,
                guest_json = guest_json
            )

            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        return user.id
    
    async def check_guest_limits(self, user_id: UUID) -> dict[str, bool]:
        """How many more listings this user may create.

        Was `guest_limits`, and nothing could call it: the two call sites in
        permissions/dependencies.py ask for `check_guest_limits`, and the body read
        `user_id` while the parameter was named `id` and counted a `Car` class that was
        never imported. It counted garage cars and spare parts, both of which went with
        story 1; a guest's one allowed object is now the one listing they may publish.
        """
        result = await self.db.execute(
            select(Users).where(Users.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_guest:
            return {"can_create_car": True}

        listing_count = await self.db.execute(
            select(func.count()).where(SaleCars.user_id == user_id)
        )

        return {"can_create_car": listing_count.scalar_one() < 1}
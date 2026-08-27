from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional
from app.models.users import Users
from app.permissions.roles import UserRole
from datetime import datetime
from loguru import logger

from uuid import UUID
from app.models.cars import Cars
from app.models.spare_parts import SpareParts

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_get_yandex_user(self, yandex_id: str, yandex_json: str):
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

    async def create_or_get_vk_user(self, vk_id: str, vk_json: str):
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
    
    async def guest_limits(self,id : UUID) -> dict[str,bool] : 
        result = await self.db.execute(
        select(Users).where(Users.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_guest:
            return {"can_create_car": True, "can_create_spare_part": True}  # не гость — без лимитов
    
        car_count = await self.db.execute(
            select(func.count()).where(Car.user_id == user_id)
        )
        cars_created = car_count.scalar_one()
    
        spare_part_count = await self.db.execute(
            select(func.count()).where(SpareParts.user_id == user_id)
        )
        spare_parts_created = spare_part_count.scalar_one()
    
        return {
            "can_create_car": cars_created < 1,
            "can_create_spare_part": spare_parts_created < 1
        }
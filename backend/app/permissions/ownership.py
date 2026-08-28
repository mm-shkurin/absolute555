"""Who owns what.

Ownership is not a role: the seller who wrote a listing may manage it, and so may a
moderator holding EDIT_ANY_SALE_CAR. Both answers live here rather than beside the
FastAPI dependencies, which are about the caller alone.

The two sale-car checks were each defined twice in dependencies.py, the second copy
silently shadowing the first; they are one each here.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.offer import Offer
from app.models.sale_car import SaleCars
from app.models.users import Users

from .dependencies import has_permission
from .permissions import Permission
from .roles import UserRole


async def can_manage_sale_car(current_user: Users, sale_car_user_id: str) -> bool:
    if str(current_user.id) == sale_car_user_id:
        return True
    
    try:
        user_role = UserRole(current_user.role)
    except ValueError:
        return False
    
    can_edit_any = await has_permission(user_role, Permission.EDIT_ANY_SALE_CAR)
    can_delete_any = await has_permission(user_role, Permission.DELETE_ANY_SALE_CAR)
    
    return can_edit_any or can_delete_any

async def can_delete_sale_car_photos(current_user: Users, sale_car_user_id: str) -> bool:
    if str(current_user.id) == sale_car_user_id:
        return True
    
    try:
        user_role = UserRole(current_user.role)
    except ValueError:
        return False
    
    return await has_permission(user_role, Permission.DELETE_ANY_SALE_CAR_PHOTOS)

async def can_manage_offer_as_owner(
    current_user: Users,
    sale_car_id: str,
    db: AsyncSession
) -> bool:
    """
    Проверяю, является ли текущий пользователь владельцем автомобиля,
    на который сделано предложение.
    """
    # Админ или пользователь с правом EDIT_ANY_SALE_CAR может управлять всеми предложениями на авто
    try:
        user_role = UserRole(current_user.role)
    except ValueError:
        return False
    
    if await has_permission(user_role, Permission.EDIT_ANY_SALE_CAR):
        return True
    
    result = await db.execute(
        select(SaleCars).where(SaleCars.sale_car_id == sale_car_id)
    )
    car = result.scalar_one_or_none()
    if not car:
        return False
    return str(car.user_id) == str(current_user.id)

async def can_manage_offer(
    current_user: Users,
    offer: Offer,
    db: AsyncSession
) -> bool:
    """
    Проверяею, может ли пользователь просматривать/управлять предложением:
    - автор предложения
    - владелец автомобиля (через can_manage_offer_as_owner)
    - администратор или пользователь с правом EDIT_ANY_SALE_CAR
    """
    if str(offer.user_id) == str(current_user.id):
        return True
    
    return await can_manage_offer_as_owner(current_user, str(offer.sale_car_id), db)

from typing import List
from fastapi import Depends, HTTPException, status
from app.models.users import Users
from app.models.cars import Cars
from app.models.spare_parts import SpareParts
from app.models.offer import Offer,OfferStatus
from app.utils.security import get_current_user
from .roles import UserRole
from .permissions import Permission
from .mapping import ROLE_PERMISSIONS
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from sqlalchemy import select,func 

async def get_user_permissions(user_role: UserRole) -> set[Permission]:
    return ROLE_PERMISSIONS.get(user_role, set())

async def has_permission(user_role: UserRole, permission: Permission) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return permission in user_permissions

async def has_any_permission(user_role: UserRole, permissions: List[Permission]) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return any(perm in user_permissions for perm in permissions)

async def has_all_permissions(user_role: UserRole, permissions: List[Permission]) -> bool:
    user_permissions = await get_user_permissions(user_role)
    return all(perm in user_permissions for perm in permissions)

def require_permission(permission: Permission):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )
        if not await has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {permission.value}"
            )
        return current_user
    return permission_checker

def require_any_permission(permissions: List[Permission]):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )
        if not await has_any_permission(user_role, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
        return current_user
    return permission_checker

def require_all_permissions(permissions: List[Permission]):
    async def permission_checker(current_user: Users = Depends(get_current_user)):
        try:
            user_role = UserRole(current_user.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )
        if not await has_all_permissions(user_role, permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
        return current_user
    return permission_checker

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

async def require_guest_can_create_car(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user  
    
    user_service = UserService(db)
    limits = await user_service.check_guest_limits(current_user.id)
    
    if not limits["can_create_car"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest limit reached: only 1 car allowed. Please verify your account to create more."
        )
    return current_user


async def require_guest_can_create_repair(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user
    
    user_service = UserService(db)
    limits = await user_service.check_guest_limits(current_user.id)
    
    if not limits["can_create_repair"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest limit reached: only 1 repair record allowed."
        )
    return current_user


async def forbid_guest_view_prices(
    current_user: Users = Depends(get_current_user)
) -> Users:
    if current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Price information is available only for verified users."
        )
    return current_user


async def forbid_guest_publish_sale(
    current_user: Users = Depends(get_current_user)
) -> Users:
    if current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Publishing cars for sale requires a verified account."
        )
    return current_user

async def forbid_guest(current_user: Users = Depends(get_current_user)) -> Users:
    if current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is not available for guest users"
        )
    return current_user


async def check_guest_car_limit(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user
    
    result = await db.execute(
        select(func.count()).where(Cars.user_id == current_user.id)
    )
    car_count = result.scalar_one()
    
    if car_count >= 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest users can only create 1 car. Please verify your account to create more."
        )
    return current_user


async def check_guest_repair_limit(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Users:
    if not current_user.is_guest:
        return current_user
    
    result = await db.execute(
        select(func.count()).where(SpareParts.user_id == current_user.id)
    )
    repair_count = result.scalar_one()
    
    if repair_count >= 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest users can only create 1 repair record. Please verify your account to create more."
        )
    return current_user
"""Listings: creating a draft, filling it in, reading it back.

The transitions between statuses live next door in sale_car_lifecycle.py; this module
never writes `status`.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.sale_car import SaleCarStatus
from app.models.users import Users
from app.permissions.dependencies import can_delete_sale_car_photos, can_manage_sale_car
from app.schemas.sale_cars import (
    SaleCarPhotoDelete,
    SaleCarPhotoUpload,
    SaleCarResponse,
    SaleCarUpdate,
)
from app.services.listing_errors import ListingError
from app.services.listing_lifecycle import ListingLifecycleService
from app.services.sale_cars_service import SaleCarService
from app.utils.security import get_current_user, get_current_user_or_none

from .listing_http import PUBLIC_STATUSES, listing_of, to_http
from .sale_car_lifecycle import lifecycle_router
from .sale_car_view import to_view, to_views

sale_car_router = APIRouter()


@sale_car_router.post("", response_model=SaleCarResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    try:
        draft = await ListingLifecycleService(db).create_draft(str(current_user.id))
    except ListingError as error:
        raise to_http(error)
    return await to_view(draft)


@sale_car_router.get("/list", response_model=List[SaleCarResponse])
async def list_sale_cars(
    status: Optional[SaleCarStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    service = SaleCarService(db)
    cars = await service.get_all_sale_cars(status=status or SaleCarStatus.PUBLISHED)
    return await to_views(cars)


@sale_car_router.get("/user", response_model=List[SaleCarResponse])
async def list_my_sale_cars(
    status: Optional[SaleCarStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    cars = await service.get_sale_cars_by_user(str(current_user.id), status=status)
    return await to_views(cars)


@sale_car_router.get("/{sale_car_id}", response_model=SaleCarResponse)
async def get_sale_car_by_id(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Users] = Depends(get_current_user_or_none),
):
    service = ListingLifecycleService(db)
    try:
        listing = await service.get(sale_car_id)
    except ListingError as error:
        raise to_http(error)

    if listing.status not in PUBLIC_STATUSES:
        owner = current_user is not None and await can_manage_sale_car(
            current_user, str(listing.user_id)
        )
        if not owner:
            raise HTTPException(status_code=404, detail="Sale car not found")

    return await to_view(listing)


@sale_car_router.patch("/{sale_car_id}", response_model=SaleCarResponse)
async def update_sale_car(
    sale_car_id: str,
    sale_car_update: SaleCarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = ListingLifecycleService(db)
    fields = sale_car_update.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No data to update")

    try:
        await listing_of(service, sale_car_id, current_user)
        updated = await service.edit(sale_car_id, fields)
    except ListingError as error:
        raise to_http(error)
    return await to_view(updated)


@sale_car_router.delete("/{sale_car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale_car(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")

    await service.delete_sale_car(sale_car_id)
    return None


@sale_car_router.post("/{sale_car_id}/photos")
async def add_sale_car_photos(
    sale_car_id: str,
    payload: SaleCarPhotoUpload,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")

    updated = await service.add_sale_car_photos(sale_car_id, payload.photos_b64)
    return {"sale_car_id": sale_car_id, "s3_photo_car_keys": updated.s3_photo_car_keys}


@sale_car_router.delete("/{sale_car_id}/photos")
async def delete_sale_car_photos(
    sale_car_id: str,
    payload: SaleCarPhotoDelete,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    if not await can_delete_sale_car_photos(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")

    return await service.delete_sale_car_photos(sale_car_id, payload.photo_keys)


sale_car_router.include_router(lifecycle_router)

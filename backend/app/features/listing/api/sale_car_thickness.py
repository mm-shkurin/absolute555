"""Карта замеров объявления, по HTTP.

Панель — часть пути, а не поле тела: набор фиксирован, и `PUT` по адресу панели
идемпотентен — повторный вызов перезаписывает замер, а не заводит второй.
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.db.database import get_db
from app.features.listing.panels import BodyPanel
from app.features.listing.schemas.thickness import ThicknessMap
from app.features.listing.services.listing_errors import ListingError
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.thickness_service import ThicknessMapService
from app.permissions.ownership import can_manage_sale_car
from app.utils.security import get_current_user, get_current_user_or_none

from .listing_http import PUBLIC_STATUSES, listing_of, to_http
from .sale_car_view import to_thickness_map

thickness_router = APIRouter()


@thickness_router.get("/{sale_car_id}/thickness", response_model=ThicknessMap)
async def read_map(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user_or_none),
):
    """Карта видна тем же, кому видно объявление."""
    try:
        listing = await ListingLifecycleService(db).get(sale_car_id)
    except ListingError as error:
        raise to_http(error)

    if listing.status not in PUBLIC_STATUSES:
        owner = current_user is not None and await can_manage_sale_car(
            current_user, str(listing.user_id)
        )
        if not owner:
            raise ResourceNotFoundError("Sale car not found", code="LISTING_NOT_FOUND")

    return to_thickness_map(listing, await ThicknessMapService(db).map_of(listing))


@thickness_router.put("/{sale_car_id}/thickness/{panel}", response_model=ThicknessMap)
async def record_measurement(
    sale_car_id: str,
    panel: BodyPanel,
    value_um: int = Form(...),
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        listing = await listing_of(ListingLifecycleService(db), sale_car_id, current_user)
        payload = (photo.filename, photo.content_type, await photo.read())
        measured = await ThicknessMapService(db).record(listing, panel, value_um, payload)
    except ListingError as error:
        raise to_http(error)
    return to_thickness_map(listing, measured)


@thickness_router.delete("/{sale_car_id}/thickness/{panel}", response_model=ThicknessMap)
async def remove_measurement(
    sale_car_id: str,
    panel: BodyPanel,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        listing = await listing_of(ListingLifecycleService(db), sale_car_id, current_user)
        left = await ThicknessMapService(db).remove(listing, panel)
    except ListingError as error:
        raise to_http(error)
    return to_thickness_map(listing, left)

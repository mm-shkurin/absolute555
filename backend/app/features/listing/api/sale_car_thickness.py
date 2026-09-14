"""Карта замеров объявления, по HTTP.

Панель — часть пути, а не поле тела: набор фиксирован, и `PUT` по адресу панели
идемпотентен — повторный вызов перезаписывает замер, а не заводит второй.
"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.panels import BodyPanel
from app.features.listing.schemas.thickness import GaugeReading, ThicknessMap
from app.features.listing.services.listing_errors import ListingError
from app.features.listing.services.photo_image import read_limited, require_image
from app.features.listing.services.thickness_service import ThicknessMapService
from app.ml.gauge_reader import read_panel_photo
from app.utils.security import get_current_user, get_current_user_or_none

from app.shared.http.listing_http import listing_of, owned_listing, to_http, visible_listing
from app.shared.http.image_upload import image_upload
from app.shared.http.sale_car_thickness_view import to_thickness_map

thickness_router = APIRouter()


@thickness_router.get("/{sale_car_id}/thickness", response_model=ThicknessMap)
async def read_map(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user_or_none),
):
    """Карта видна тем же, кому видно объявление."""
    listing = await visible_listing(get_listing_lifecycle_service(db), sale_car_id, current_user)
    return to_thickness_map(listing, await ThicknessMapService(db).map_of(listing))


@thickness_router.post("/{sale_car_id}/thickness/read", response_model=GaugeReading)
async def read_gauge_photo(
    sale_car_id: str,
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Прочитать снимок экрана прибора, ничего не сохраняя.

    Число — подсказка: продавец сверяет его со снимком и сохраняет сам. Распознавание
    ошибается на бликах и срезанных краях экрана, и молча записанная ошибка окрасила бы
    панель у покупателя в чужой цвет. Тот же снимок при сохранении читается из кэша.
    """
    await owned_listing(get_listing_lifecycle_service(db), sale_car_id, current_user)
    with image_upload(photo.filename):
        body = await read_limited(photo)
        require_image(photo.filename, body)
    return {"value_um": await read_panel_photo(body)}


@thickness_router.put("/{sale_car_id}/thickness/{panel}", response_model=ThicknessMap)
async def record_measurement(
    sale_car_id: str,
    panel: BodyPanel,
    value_um: Optional[int] = Form(default=None),
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        listing = await listing_of(get_listing_lifecycle_service(db), sale_car_id, current_user)
        payload = (photo.filename, photo.content_type, await read_limited(photo))
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
        listing = await listing_of(get_listing_lifecycle_service(db), sale_car_id, current_user)
        left = await ThicknessMapService(db).remove(listing, panel)
    except ListingError as error:
        raise to_http(error)
    return to_thickness_map(listing, left)

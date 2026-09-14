"""Карта замеров объявления: запись панели, удаление панели, чтение карты.

Запись идемпотентна по панели: повторный вызов перезаписывает замер. Разрешена в любом
статусе объявления, в отличие от галереи, — замер это исправляемая опечатка продавца, а
не новый материал, который должен пройти модерацию заново.
"""

from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.listing.models.sale_car import SaleCars
from app.features.listing.models.thickness import ThicknessMeasurement
from app.features.listing.panels import BodyPanel, MIN_VALUE_UM, ValueSource, max_value_um
from app.features.listing.services.photo_image import require_image
from app.features.listing.services.object_cleanup import discard_objects
from app.features.listing.services.thickness_errors import (
    GaugeUnreadable,
    MeasurementNotFound,
    ValueOutOfRange,
)
from app.ml.gauge_reader import read_panel_photo
from app.shared.storage.s3_service import s3_service


def _within(value) -> bool:
    return value is not None and MIN_VALUE_UM <= value <= max_value_um()


def _chosen_value(panel: BodyPanel, value_um, read):
    if value_um is None:
        if read is None:
            raise GaugeUnreadable(panel.value)
        return read, ValueSource.OCR
    if not _within(value_um):
        raise ValueOutOfRange(value_um)
    # Форма присылает число всегда — прочитанное со снимка подставляется в поле
    # для сверки. Подтверждённое без правки — это чтение прибора, а не ручной ввод:
    # покупатель должен видеть, что число снято с экрана.
    return value_um, (ValueSource.OCR if value_um == read else ValueSource.SELLER)


class ThicknessMapService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(
        self, listing: SaleCars, panel: BodyPanel, value_um, photo: tuple
    ) -> List[ThicknessMeasurement]:
        """photo: (filename, content_type, bytes) as read from the request.

        value_um не прислали — число читается с фотографии прибора. Прислали — оно от
        продавца, а прочитанное всё равно сохраняется рядом: иначе исправленную опечатку
        прибора нечем отличить от подрисованного замера.
        """
        require_image(photo[0], photo[2])
        read = await read_panel_photo(photo[2])
        if not _within(read):
            read = None
        value_um, source = _chosen_value(panel, value_um, read)

        key = await self._store(listing, photo)
        held = await self._panel_of(listing, panel)
        stale_key = held.photo_key if held else None
        self._write(listing, panel, held, value_um, source, read, key)

        try:
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            await self._discard([key])
            raise

        # Только после того, как строка встала: снести старый кадр раньше значило бы
        # потерять доказательство, если запись не прошла.
        await self._discard([stale_key])
        return await self.map_of(listing)

    def _write(self, listing, panel, held, value_um, source, read, key) -> None:
        if held is None:
            self.db.add(
                ThicknessMeasurement(
                    sale_car_id=listing.sale_car_id,
                    panel=panel.value,
                    value_um=value_um,
                    value_source=source.value,
                    ocr_value_um=read,
                    photo_key=key,
                )
            )
            return
        held.value_um = value_um
        held.value_source = source.value
        held.ocr_value_um = read
        held.photo_key = key

    async def remove(self, listing: SaleCars, panel: BodyPanel) -> List[ThicknessMeasurement]:
        held = await self._panel_of(listing, panel)
        if held is None:
            raise MeasurementNotFound(panel.value)

        doomed = held.photo_key
        await self.db.delete(held)
        await self.db.commit()
        await self._discard([doomed])
        return await self.map_of(listing)

    async def map_of(self, listing: SaleCars) -> List[ThicknessMeasurement]:
        found = await self.db.execute(
            select(ThicknessMeasurement)
            .where(ThicknessMeasurement.sale_car_id == listing.sale_car_id)
            .order_by(ThicknessMeasurement.panel)
        )
        return list(found.scalars().all())

    async def _panel_of(
        self, listing: SaleCars, panel: BodyPanel
    ) -> Optional[ThicknessMeasurement]:
        found = await self.db.execute(
            select(ThicknessMeasurement)
            .where(ThicknessMeasurement.sale_car_id == listing.sale_car_id)
            .where(ThicknessMeasurement.panel == panel.value)
            .with_for_update()
        )
        return found.scalar_one_or_none()

    @staticmethod
    async def _store(listing: SaleCars, photo: tuple) -> str:
        filename, content_type, body = photo
        return await s3_service.put_public(
            str(listing.sale_car_id), body, content_type, folder="thickness"
        )

    _discard = staticmethod(discard_objects)

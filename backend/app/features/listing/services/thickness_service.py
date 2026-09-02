"""Карта замеров объявления: запись панели, удаление панели, чтение карты.

Запись идемпотентна по панели: повторный вызов перезаписывает замер. Разрешена в любом
статусе объявления, в отличие от галереи, — замер это исправляемая опечатка продавца, а
не новый материал, который должен пройти модерацию заново.
"""

from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.listing.models.sale_car import SaleCars
from app.features.listing.models.thickness import ThicknessMeasurement
from app.features.listing.panels import BodyPanel, MAX_VALUE_UM, MIN_VALUE_UM
from app.features.listing.services.photo_image import require_image
from app.features.listing.services.thickness_errors import MeasurementNotFound, ValueOutOfRange
from app.shared.storage.s3_service import s3_service


class ThicknessMapService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(
        self, listing: SaleCars, panel: BodyPanel, value_um: int, photo: tuple
    ) -> List[ThicknessMeasurement]:
        """photo: (filename, content_type, bytes) as read from the request."""
        if not MIN_VALUE_UM <= value_um <= MAX_VALUE_UM:
            raise ValueOutOfRange(value_um)

        key = await self._store(listing, photo)
        held = await self._panel_of(listing, panel)
        stale_key = held.photo_key if held else None

        if held is None:
            self.db.add(
                ThicknessMeasurement(
                    sale_car_id=listing.sale_car_id,
                    panel=panel.value,
                    value_um=value_um,
                    photo_key=key,
                )
            )
        else:
            held.value_um = value_um
            held.photo_key = key

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
        require_image(filename, body)
        return await s3_service.upload_file_get_key_from_bytes(
            str(listing.sale_car_id), body, content_type=content_type, folder="thickness"
        )

    @staticmethod
    async def _discard(keys) -> None:
        alive = [key for key in keys if key]
        if not alive:
            return
        try:
            await s3_service.delete_files(alive)
        except Exception as error:
            # Строка уже верна. Осиротевший объект в бакете — мусор, а не порча данных.
            logger.warning(f"could not discard {len(alive)} object(s): {error}")

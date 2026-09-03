"""Запись распознанного на объявление — одна на оба источника.

По снимку СТС и по вписанному VIN приезжают одни и те же поля, и класть их на строку
двумя способами значило бы иметь два разных объявления из двух источников одного и того
же. Марка и модель идут через `CatalogResolver`: они имена, а объявление хранит ключи
справочника, и разрешение может ещё и поставить написание в очередь модератору.
"""

from loguru import logger
from sqlalchemy import select

from app.db.database import get_db_session
from app.features.catalog.services.catalog_resolver import CatalogResolver
from app.features.listing.models.sale_car import SaleCars


def apply_decoded(sale_car: SaleCars, result: dict) -> None:
    """Copy the decoded fields onto the listing.

    Make and model are not written here — they are names, and the listing stores
    catalogue keys. `CatalogResolver` owns that step because resolving may also queue a
    spelling for a moderator, which is a write this function has no business making.

    Only truthy values are copied: a reader still returns "" often enough that
    overwriting a value the seller already corrected by hand would be a real regression.
    """
    if result.get("vin"):
        sale_car.vin = result["vin"]

    # year and engine_power come back as numbers most of the time and as strings the
    # rest, depending on whether the model obeyed the prompt. int() on a stray "2018 г."
    # would kill the task after the expensive part already succeeded.
    for field in ("year", "engine_power"):
        raw = result.get(field)
        if raw in (None, ""):
            continue
        try:
            setattr(sale_car, field, int(raw))
        except (TypeError, ValueError):
            logger.warning(f"a reader returned a non-numeric {field}: {raw!r}")

    if result.get("transmission"):
        sale_car.transmission = result["transmission"]


async def persist_decoded(sale_car_id: str, result: dict) -> bool:
    """Write one reading onto its listing. False when the listing is no longer there."""
    async with get_db_session() as db:
        found = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
        sale_car = found.scalar_one_or_none()
        if sale_car is None:
            logger.warning(f"a reading finished for a listing that no longer exists: {sale_car_id}")
            return False

        apply_decoded(sale_car, result)
        await CatalogResolver(db).resolve_into(sale_car, result.get("mark"), result.get("model"))
        await db.commit()
    return True

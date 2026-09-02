from loguru import logger
from sqlalchemy import select

from app.db.database import get_db_session
from app.ml.decode_vin import decode_vin
from app.features.listing.models.sale_car import SaleCars
from app.features.catalog.services.catalog_resolver import CatalogResolver
from app.shared.storage.s3_service import s3_service
from app.tasks.status_updater import TaskStatus, update_task_status


# A failure to read the picture and a failure to make sense of what was read are
# different outcomes to the seller: the first is fixed by retaking the photograph, the
# second only by typing the fields in. Everything that is not the reading step -- a model
# that answered with something unparseable, or did not answer at all -- failed at decoding.
UNREADABLE = ("ocr_failed", "file_bytes is required")


def failed_at(error: str | None) -> str:
    return TaskStatus.OcrFailed if error in UNREADABLE else TaskStatus.DecodeFailed


def _apply_decoded(sale_car: SaleCars, result: dict) -> None:
    """Copy the decoded СТС fields onto the listing.

    Make and model are not written here — they are names, and the listing stores
    catalogue keys. `CatalogResolver` owns that step because resolving may also queue a
    spelling for a moderator, which is a write this function has no business making.

    Only truthy values are copied: GigaChat is asked never to leave a field empty and
    to guess instead, but it still returns "" often enough that overwriting a value the
    seller already corrected by hand would be a real regression.
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
            logger.warning(f"decode_vin returned a non-numeric {field}: {raw!r}")

    if result.get("transmission"):
        sale_car.transmission = result["transmission"]


async def decode_vin_from_sts(ctx: dict, sale_car_id: str, sts_key: str):
    """Read the СТС scan of one listing and write what it says onto the row.

    The scan is fetched from the closed bucket by key rather than carried through the
    queue: a photograph base64-encoded into a Redis job is megabytes of payload sitting in
    the broker, and the bytes are already in object storage anyway.
    """
    try:
        await update_task_status(sale_car_id, TaskStatus.STARTED, entity_type="sale_car")

        file_bytes = await s3_service.get_document(sts_key)

        await update_task_status(sale_car_id, TaskStatus.OcrStarted, entity_type="sale_car")

        try:
            result = await decode_vin(file_bytes=file_bytes, car_id=sale_car_id)

            if result.get("error"):
                stopped_at = failed_at(result.get("error"))
                logger.error(
                    f"decode_vin failed for sale_car_id={sale_car_id} at {stopped_at}: "
                    f"{result.get('error')} {result.get('message', '')}"
                )
                await update_task_status(sale_car_id, stopped_at, entity_type="sale_car")
                await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                return {"sale_car_id": sale_car_id, "result": result, "error": True}

            await update_task_status(sale_car_id, TaskStatus.OcrSuccess, entity_type="sale_car")
        except Exception as e:
            logger.exception(f"Exception in decode_vin for sale_car_id={sale_car_id}: {e}")
            await update_task_status(sale_car_id, TaskStatus.OcrFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.DecodeStarted, entity_type="sale_car")
        await update_task_status(sale_car_id, TaskStatus.DecodeProcessing, entity_type="sale_car")

        # The decode step used to be "write the result to ChromaDB", which is why it had
        # its own success/failure statuses. Persisting is now one write to the listing
        # row, so DecodeSuccess is reported once that write commits — not before it,
        # which would let a task report success over a listing that never changed.
        try:
            async with get_db_session() as db:
                res = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
                sale_car = res.scalar_one_or_none()
                if sale_car is None:
                    logger.warning(f"decode_vin finished for a listing that no longer exists: {sale_car_id}")
                    await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
                    await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                    return {"sale_car_id": sale_car_id, "result": result, "error": True}

                _apply_decoded(sale_car, result)
                await CatalogResolver(db).resolve_into(
                    sale_car, result.get("mark"), result.get("model")
                )
                await db.commit()

            await update_task_status(sale_car_id, TaskStatus.DecodeSuccess, entity_type="sale_car")
        except Exception:
            await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.SUCCESS, entity_type="sale_car")

        return {"sale_car_id": sale_car_id, "result": result}

    except Exception as e:
        logger.exception(f"decode_vin_from_sts failed for sale_car_id={sale_car_id}: {e}")

        await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")

        raise

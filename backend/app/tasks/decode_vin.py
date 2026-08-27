import base64
from loguru import logger
from sqlalchemy import select

from app.tasks.decorators import async_task
from app.tasks.status_updater import update_task_status, TaskStatus
from app.ml.decode_vin import decode_vin
from app.db.database import get_db_session
from app.models.sale_car import SaleCars


def _apply_decoded(sale_car: SaleCars, result: dict) -> None:
    """Copy the decoded СТС fields onto the listing.

    `decode_vin` answers six flat values — vin, mark, model, year, transmission,
    engine_power — and until story 1 all but the VIN were written to ChromaDB, with only
    a document id kept on the row. They are columns now, so this writes them directly.

    Only truthy values are copied: GigaChat is asked never to leave a field empty and
    to guess instead, but it still returns "" often enough that overwriting a value the
    seller already corrected by hand would be a real regression.
    """
    if result.get("vin"):
        sale_car.vin = result["vin"]
    if result.get("mark"):
        sale_car.mark = result["mark"]
    if result.get("model"):
        sale_car.model = result["model"]

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


@async_task("decode_vin_from_sts_sale_car")
async def decode_vin_from_sts_sale_car_task(sale_car_id: str, file_b64: str):

    try:
        await update_task_status(sale_car_id, TaskStatus.STARTED, entity_type="sale_car")

        file_bytes = base64.b64decode(file_b64)

        await update_task_status(sale_car_id, TaskStatus.OcrStarted, entity_type="sale_car")

        try:
            result = await decode_vin(file_bytes=file_bytes, car_id=sale_car_id)

            if result.get("error"):
                error_type = result.get("error")
                if error_type in ["gigachat_connection_error", "gigachat_error"]:
                    logger.error(f"GigaChat error in decode_vin for sale_car_id={sale_car_id}: {result.get('message', 'Unknown error')}")
                    await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
                    await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                    return {"sale_car_id": sale_car_id, "result": result, "error": True}
                else:
                    await update_task_status(sale_car_id, TaskStatus.OcrFailed, entity_type="sale_car")
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
                await db.commit()

            await update_task_status(sale_car_id, TaskStatus.DecodeSuccess, entity_type="sale_car")
        except Exception:
            await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
            raise

        await update_task_status(sale_car_id, TaskStatus.SUCCESS, entity_type="sale_car")

        return {"sale_car_id": sale_car_id, "result": result}

    except Exception as e:
        logger.exception(f"Error in decode_vin_from_sts_sale_car_task sale_car_id={sale_car_id}: {e}")

        await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")

        raise

from loguru import logger

from app.ml.decode_vin import decode_vin
from app.shared.storage.s3_service import s3_service
from app.tasks.decode_persist import persist_decoded
from app.tasks.status_updater import TaskStatus, update_task_status


# A failure to read the picture and a failure to make sense of what was read are
# different outcomes to the seller: the first is fixed by retaking the photograph, the
# second only by typing the fields in. Everything that is not the reading step -- a model
# that answered with something unparseable, or did not answer at all -- failed at decoding.
UNREADABLE = ("ocr_failed", "file_bytes is required")


def failed_at(error: str | None) -> str:
    return TaskStatus.OcrFailed if error in UNREADABLE else TaskStatus.DecodeFailed


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
            if not await persist_decoded(sale_car_id, result):
                await update_task_status(sale_car_id, TaskStatus.DecodeFailed, entity_type="sale_car")
                await update_task_status(sale_car_id, TaskStatus.FAILURE, entity_type="sale_car")
                return {"sale_car_id": sale_car_id, "result": result, "error": True}

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

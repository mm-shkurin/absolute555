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


async def _report(sale_car_id: str, *statuses: str) -> None:
    for status in statuses:
        await update_task_status(sale_car_id, status, entity_type="sale_car")


async def _read_scan(sale_car_id: str, sts_key: str) -> dict:
    file_bytes = await s3_service.get_document(sts_key)
    await _report(sale_car_id, TaskStatus.OcrStarted)
    try:
        return await decode_vin(file_bytes=file_bytes, car_id=sale_car_id)
    except Exception as e:
        logger.exception(f"Exception in decode_vin for sale_car_id={sale_car_id}: {e}")
        await _report(sale_car_id, TaskStatus.OcrFailed)
        raise


async def _persist(sale_car_id: str, result: dict) -> bool:
    await _report(sale_car_id, TaskStatus.DecodeStarted, TaskStatus.DecodeProcessing)
    # DecodeSuccess is reported once the write to the listing commits, not before it:
    # earlier would let a task report success over a listing that never changed.
    try:
        return await persist_decoded(sale_car_id, result)
    except Exception:
        await _report(sale_car_id, TaskStatus.DecodeFailed)
        raise


async def _run_stages(sale_car_id: str, sts_key: str) -> tuple[str | None, dict]:
    """Walk the scan through reading and writing. Returns the stage it stopped at, if any."""
    await _report(sale_car_id, TaskStatus.STARTED)
    result = await _read_scan(sale_car_id, sts_key)
    if result.get("error"):
        stopped_at = failed_at(result.get("error"))
        logger.error(
            f"decode_vin failed for sale_car_id={sale_car_id} at {stopped_at}: "
            f"{result.get('error')} {result.get('message', '')}"
        )
        return stopped_at, result
    await _report(sale_car_id, TaskStatus.OcrSuccess)
    if not await _persist(sale_car_id, result):
        return TaskStatus.DecodeFailed, result
    await _report(sale_car_id, TaskStatus.DecodeSuccess, TaskStatus.SUCCESS)
    return None, result


async def _fail(sale_car_id: str, stopped_at: str, result: dict) -> dict:
    await _report(sale_car_id, stopped_at, TaskStatus.FAILURE)
    return {"sale_car_id": sale_car_id, "result": result, "error": True}


async def decode_vin_from_sts(ctx: dict, sale_car_id: str, sts_key: str):
    """Read the СТС scan of one listing and write what it says onto the row.

    The scan is fetched from the closed bucket by key rather than carried through the
    queue: a photograph base64-encoded into a Redis job is megabytes of payload sitting in
    the broker, and the bytes are already in object storage anyway.
    """
    try:
        stopped_at, result = await _run_stages(sale_car_id, sts_key)
    except Exception as e:
        logger.exception(f"decode_vin_from_sts failed for sale_car_id={sale_car_id}: {e}")
        await _report(sale_car_id, TaskStatus.FAILURE)
        raise
    # Outside the try: a failure already being recorded must not be recorded twice.
    if stopped_at is not None:
        return await _fail(sale_car_id, stopped_at, result)
    return {"sale_car_id": sale_car_id, "result": result}

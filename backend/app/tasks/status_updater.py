import asyncio
from sqlalchemy import select
from loguru import logger
from app.db.database import get_db_session
from app.models.sale_car import SaleCars
from app.sse.manager import sse_manager


async def update_task_status(entity_id: str, status: str, entity_type: str = "sale_car"):
    """Record a background task's progress on the listing and push it over SSE.

    Story 1 left one entity here. There used to be three branches — "car" (the personal
    garage), "spare_part" (the parts catalogue) and "sale_car" — and the default was
    "car", so every caller that omitted entity_type wrote to the garage. The default is
    the listing now, which is the only thing a background task touches.
    """
    if entity_type != "sale_car":
        logger.warning(f"update_task_status called with an unknown entity_type: {entity_type!r}")
        return

    try:
        async with get_db_session() as db:
            res = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == entity_id))
            entity = res.scalar_one_or_none()
            if entity is None:
                logger.warning(f"SaleCar not found for sale_car_id={entity_id}")
                return

            entity.task_status = status
            await db.commit()
            logger.info(f"Updated task status for sale_car_id={entity_id}: {status}")

            try:
                message = {
                    "status": status,
                    "sale_car_id": entity_id,
                    "timestamp": asyncio.get_event_loop().time(),
                    "type": "status_update",
                }
                logger.info(f"Sending SSE message to sale_car_id={entity_id}: {message}")
                await sse_manager.send_message(entity_id, message)
                logger.info(f"SSE message sent successfully to sale_car_id={entity_id}")
            except Exception as sse_error:
                logger.error(f"Failed to send SSE message to sale_car_id={entity_id}: {sse_error}")

    except Exception as e:
        logger.error(f"Failed to update task status for {entity_type}_id={entity_id}: {e}")
        raise


class TaskStatus:
    PENDING = "Pending"
    STARTED = "Started"

    OcrStarted = "OcrStarted"
    OcrSuccess = "OcrSuccess"
    OcrFailed = "OcrFailed"
    DecodeStarted = "DecodeStarted"
    DecodeProcessing = "DecodeProcessing"
    DecodeSuccess = "DecodeSuccess"
    DecodeFailed = "DecodeFailed"

    # The Prediction* statuses belonged to the spare-part prediction and the ChromaSave*
    # ones to writing the decoded document into ChromaDB. Both went with story 1;
    # persisting the decode is now part of DecodeSuccess.

    SUCCESS = "Success"
    FAILURE = "Failure"

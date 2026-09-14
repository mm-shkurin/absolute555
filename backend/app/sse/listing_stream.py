"""The SSE stream a listing's decode task publishes on.

Two sources feed one client: the in-process queue the SSE manager fans out to, and the
Redis channel the ARQ worker publishes to -- the worker is a separate process, so
the queue alone would only ever reach the worker that happens to share the request's
process.
"""

import asyncio
import json
import time
import uuid

from loguru import logger
from sqlalchemy import select

from app.db.database import get_db_session
from app.features.listing.models.sale_car import SaleCars
from app.sse.listing_redis import (
    close_subscription,
    get_redis_message,  # noqa: F401 -- kept importable from its old home
    open_pubsub,
    read_channel_frame,
    subscribe,
)
from app.sse.manager import sse_manager
from app.tasks.status_updater import TaskStatus

HEARTBEAT_SECONDS = 30.0


def _frame(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _held_status(sale_car_id: str) -> str:
    try:
        async with get_db_session() as db:
            result = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
            sale_car = result.scalar_one_or_none()
            if sale_car and sale_car.task_status:
                return sale_car.task_status
    except Exception as e:
        logger.warning(f"Could not fetch listing status from DB: {e}, using PENDING")
    return TaskStatus.PENDING


def _take_local(queue: asyncio.Queue, sale_car_id: str) -> tuple[bool, str | None]:
    """Whether the queue held a message, and the frame for it when it is this listing's."""
    try:
        message = queue.get_nowait()
    except asyncio.QueueEmpty:
        return False, None
    named = message.get("sale_car_id")
    if named is None or str(named) == str(sale_car_id):
        logger.info(f"Sending local queue message for sale_car_id={sale_car_id}: {message.get('status', 'unknown')}")
        return True, _frame(message)
    logger.debug(f"Skipping local message for different sale_car_id: {named} != {sale_car_id}")
    return True, None


async def _relay(sale_car_id: str, queue: asyncio.Queue, pubsub):
    last_heartbeat = time.time()
    while True:
        try:
            took, frame = _take_local(queue, sale_car_id)
            if frame:
                yield frame
            if took:
                continue
            frame = await read_channel_frame(pubsub, sale_car_id)
            if frame:
                yield frame
            now = time.time()
            if now - last_heartbeat >= HEARTBEAT_SECONDS:
                last_heartbeat = now
                yield _frame({"type": "heartbeat", "sale_car_id": sale_car_id, "timestamp": now})
            await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Error in message loop for sale_car_id={sale_car_id}: {e}")
            await asyncio.sleep(0.1)


async def listing_events(sale_car_id: str):
    """Server-sent events for one listing's OCR task."""
    try:
        uuid.UUID(sale_car_id)
    except ValueError:
        yield _frame({"type": "error", "message": "Invalid sale_car_id format"})
        return

    queue = asyncio.Queue()
    pubsub = relay = None
    try:
        sse_manager.add_connection(sale_car_id, queue)
        pubsub = open_pubsub()
        await subscribe(pubsub, sale_car_id)
        status = await _held_status(sale_car_id)
        logger.info(f"Sending initial SSE message for sale_car_id={sale_car_id}, status={status}")
        yield _frame({"sale_car_id": sale_car_id, "status": status, "type": "initial", "timestamp": time.time()})
        relay = _relay(sale_car_id, queue, pubsub)
        async for frame in relay:
            yield frame
    except asyncio.CancelledError:
        logger.info(f"SSE connection cancelled for sale_car_id={sale_car_id}")
    except Exception as e:
        logger.error(f"Error in SSE stream for sale_car_id={sale_car_id}: {e}")
        yield _frame({"type": "error", "message": str(e), "sale_car_id": sale_car_id})
    finally:
        if relay is not None:
            await relay.aclose()
        sse_manager.remove_connection(sale_car_id, queue)
        close_subscription(pubsub, sale_car_id)

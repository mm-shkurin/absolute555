"""The decode task status a listing holds, read in a session of its own.

A stream outlives the request that opened it, so it cannot borrow the request's session.
"""

from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db_session
from app.features.listing.models.sale_car import SaleCars
from app.tasks.status_updater import TaskStatus


async def held_task_status(sale_car_id: str) -> str:
    try:
        async with get_db_session() as db:
            result = await db.execute(select(SaleCars).where(SaleCars.sale_car_id == sale_car_id))
            sale_car = result.scalar_one_or_none()
            if sale_car and sale_car.task_status:
                return sale_car.task_status
    except SQLAlchemyError as e:
        logger.warning("Could not fetch listing status from DB: {}, using PENDING", e)
    return TaskStatus.PENDING

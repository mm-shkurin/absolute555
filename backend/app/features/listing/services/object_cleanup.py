"""Removing stored objects a listing no longer points at."""

from typing import Iterable

from loguru import logger

from app.shared.storage.s3_service import s3_service


async def discard_objects(keys: Iterable) -> None:
    alive = [key for key in keys if key]
    if not alive:
        return
    try:
        await s3_service.delete_files(alive)
    except Exception as error:
        # The row is already right. An orphan in the bucket is waste, not corruption.
        logger.warning(f"could not discard {len(alive)} object(s): {error}")

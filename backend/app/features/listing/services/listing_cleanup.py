"""Removing stored objects a listing no longer points at."""

from typing import Iterable

from loguru import logger

from app.shared.storage.s3_service import s3_service


async def discard_objects(keys: Iterable) -> None:
    alive = [key for key in keys if key]
    if not alive:
        return
    failed = (await s3_service.delete_files(alive))["failed"]
    if failed:
        # The row is already right. An orphan in the bucket is waste, not corruption.
        logger.warning("could not discard {} object(s)", len(failed))

"""The gallery of a listing: adding photographs, removing one, arranging the order.

The list's order is the displayed order and its first element is the cover. There is no
separate cover field on purpose -- two sources of truth would disagree the first time a
reorder half-applied.

An upload applies whole or not at all. A file that fails validation takes with it every
file already stored in that same request, so a refusal never leaves a half-filled gallery
and never leaves bytes in the bucket that nothing points at.
"""

import uuid
from typing import List, Sequence

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import PhotoSettings
from app.models.sale_car import SaleCars, SaleCarStatus
from app.services.listing_errors import ListingFrozen
from app.services.photo_errors import (
    GalleryLimitReached,
    NoFilesGiven,
    NotAnImage,
    OrderMismatch,
    PhotoNotFound,
    PhotoTooLarge,
)
from app.services.photo_image import build_preview, is_image
from app.services.s3_service import s3_service

photo_settings = PhotoSettings()

EDITABLE_IN = frozenset({SaleCarStatus.DRAFT, SaleCarStatus.REJECTED})


class ListingGalleryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add(self, listing: SaleCars, files: Sequence[tuple]) -> SaleCars:
        """files: (filename, content_type, bytes) as read from the request."""
        if not files:
            raise NoFilesGiven()
        self._require_editable(listing)

        # Checked twice on purpose. Once here, so a request that could never fit is
        # refused before a byte is uploaded; and once under a row lock below, because
        # between the two checks another upload of the same listing may have landed.
        self._require_room(listing, len(files), len(listing.photos or []))

        stored: List[str] = []
        try:
            added = [await self._store(listing, file, stored) for file in files]
            locked = await self._lock(listing)
            self._require_room(listing, len(files), len(locked.photos or []))
            locked.photos = list(locked.photos or []) + added
            await self._save(locked)
        except Exception:
            await self._discard(stored)
            raise

        return locked

    async def _lock(self, listing: SaleCars) -> SaleCars:
        """Re-read the row for update, so two uploads cannot both see room for one more."""
        # populate_existing, or the identity map hands back the instance this session
        # already loaded -- with the photo list it had before the lock was taken, which
        # is exactly the stale value the lock exists to avoid reading.
        found = await self.db.execute(
            select(SaleCars)
            .where(SaleCars.sale_car_id == listing.sale_car_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return found.scalar_one()

    @staticmethod
    def _require_room(listing: SaleCars, offered: int, held: int) -> None:
        if held + offered > photo_settings.max_photos_per_listing:
            raise GalleryLimitReached(
                limit=photo_settings.max_photos_per_listing, held=held, offered=offered
            )

    async def remove(self, listing: SaleCars, photo_id: str) -> SaleCars:
        self._require_editable(listing)

        photos = list(listing.photos or [])
        doomed = next((photo for photo in photos if photo["photo_id"] == photo_id), None)
        if doomed is None:
            raise PhotoNotFound(photo_id)

        listing.photos = [photo for photo in photos if photo["photo_id"] != photo_id]
        await self._save(listing)
        await self._discard([doomed["key"], doomed.get("preview_key")])
        return listing

    async def reorder(self, listing: SaleCars, photo_ids: Sequence[str]) -> SaleCars:
        # Allowed in any status, unlike adding and removing: these photographs have already
        # been through moderation, and rearranging them shows a buyer nothing new.
        photos = list(listing.photos or [])
        held = {photo["photo_id"] for photo in photos}
        given = list(photo_ids)

        missing = sorted(held - set(given))
        unknown = [photo_id for photo_id in given if photo_id not in held]
        if missing or unknown or len(given) != len(set(given)):
            raise OrderMismatch(missing=missing, unknown=unknown)

        by_id = {photo["photo_id"]: photo for photo in photos}
        listing.photos = [by_id[photo_id] for photo_id in given]
        await self._save(listing)
        return listing

    async def _store(self, listing: SaleCars, file: tuple, stored: List[str]) -> dict:
        filename, content_type, body = file

        if len(body) > photo_settings.max_photo_bytes:
            raise PhotoTooLarge(limit=photo_settings.max_photo_bytes, size=len(body))
        if not is_image(body):
            # The content decides, not the extension and not the declared type: a client
            # supplies both, so neither is evidence of anything.
            raise NotAnImage(filename)

        listing_id = str(listing.sale_car_id)
        key = await s3_service.upload_file_get_key_from_bytes(listing_id, body, content_type=content_type)
        stored.append(key)

        preview_key = await s3_service.upload_file_get_key_from_bytes(
            listing_id, build_preview(body), content_type="image/jpeg", folder="previews"
        )
        stored.append(preview_key)

        return {"photo_id": uuid.uuid4().hex, "key": key, "preview_key": preview_key}

    async def _save(self, listing: SaleCars) -> None:
        await self.db.commit()
        await self.db.refresh(listing, attribute_names=["photos", "updated_at"])

    @staticmethod
    def _require_editable(listing: SaleCars) -> None:
        if listing.status not in EDITABLE_IN:
            raise ListingFrozen(listing.status)

    @staticmethod
    async def _discard(keys: Sequence) -> None:
        alive = [key for key in keys if key]
        if not alive:
            return
        try:
            await s3_service.delete_files(alive)
        except Exception as error:
            # The row is already right. An orphan in the bucket is waste, not corruption.
            logger.warning(f"could not discard {len(alive)} object(s): {error}")

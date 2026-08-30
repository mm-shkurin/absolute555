"""The registration document of a listing.

It lives in the closed bucket, and the row holds only its key. What leaves this service is
a signed link with an expiry -- never the bytes, never the key. The link will end up in a
browser's history and in a referer header, and its lifetime is the only thing that bounds
where it travels.
"""

from datetime import datetime, timedelta

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import PhotoSettings
from app.models.sale_car import SaleCars
from app.services.photo_errors import DocumentNotFound
from app.services.s3_service import s3_service

photo_settings = PhotoSettings()


class ListingDocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def attach(self, listing: SaleCars, body: bytes, content_type: str) -> SaleCars:
        key = await s3_service.put_document(str(listing.sale_car_id), body, content_type)
        previous = listing.sts_key
        listing.sts_key = key
        await self.db.commit()
        await self.db.refresh(listing, attribute_names=["sts_key", "updated_at"])
        if previous:
            await self._discard(previous)
        return listing

    async def signed_link(self, listing: SaleCars) -> dict:
        if not listing.sts_key:
            raise DocumentNotFound()

        ttl = photo_settings.document_link_ttl_seconds
        url = await s3_service.sign_document_url(listing.sts_key, expires_in=ttl)
        return {"url": url, "expires_at": datetime.utcnow() + timedelta(seconds=ttl)}

    async def discard(self, listing: SaleCars) -> None:
        """Drop the scan once a moderator has decided.

        The VIN, make and year are columns by then, so the document has nothing left to
        give -- and keeping it is keeping personal data for no purpose.
        """
        key = listing.sts_key
        if not key:
            return
        # The row is cleared here and committed by the caller, which owns the transaction
        # this sits inside. Deleting the object only after that commit means a crash in
        # between leaves an orphan rather than a listing pointing at nothing.
        listing.sts_key = None
        await self.db.flush()
        await self._discard(key)

    @staticmethod
    async def _discard(key: str) -> None:
        try:
            await s3_service.delete_document(key)
        except Exception as error:
            # The row no longer points at it. An object nothing references is waste.
            logger.warning(f"could not delete document {key}: {error}")

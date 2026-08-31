"""The moderator's side of a listing: publish, turn back, take down.

Split from the lifecycle service because these three carry rules the seller's path knows
nothing about — a rejection label from a fixed five, and the complaints that a takedown
settles in the same decision.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sale_car import RejectionLabel, SaleCars, SaleCarStatus
from app.services.complaint_service import ComplaintService
from app.services.listing_document import ListingDocumentService
from app.services.listing_errors import RejectionNeedsReason, TransitionNotAllowed
from app.services.listing_lifecycle import ListingLifecycleService

LABELS = {label.value for label in RejectionLabel}


class ListingReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.lifecycle = ListingLifecycleService(db)

    async def approve(self, listing_id: str, moderator_id: str) -> SaleCars:
        listing = await self.lifecycle.get(listing_id)
        listing = await self.lifecycle.move_to(listing, SaleCarStatus.PUBLISHED)
        listing.published_at = datetime.utcnow()
        listing.reject_reason = None
        listing.reject_label = None
        self._stamp(listing, moderator_id)
        # The scan has done its work: a moderator has now compared it with what OCR read.
        await ListingDocumentService(self.db).discard(listing)
        await self.db.commit()
        return await self.lifecycle.get(listing_id)

    async def reject(
        self, listing_id: str, label: Optional[str], comment: Optional[str], moderator_id: str
    ) -> SaleCars:
        """Turn a listing back with a label the seller can act on.

        The label is required and the comment is not. A comment alone tells one seller
        what to fix; only the label answers what is rejected most often, which is what
        decides whether the wizard should have prevented it in the first place.
        """
        return await self._turn_back(listing_id, label, comment, moderator_id)

    async def take_down(self, listing_id: str, label: Optional[str], comment: Optional[str], moderator_id: str) -> SaleCars:
        """Take a published listing down over complaints.

        The listing lands in rejected, not withdrawn: withdrawn reads as the seller's own
        doing, and they would never learn what to correct. Every open complaint about it
        is settled by this one decision — left open they would show the same card again
        tomorrow with the answer already given.
        """
        standing = await self.lifecycle.get(listing_id)
        if standing.status != SaleCarStatus.PUBLISHED:
            # Taking down is about what buyers can see. A listing still waiting for review
            # is turned back through reject, which is the same decision under its own name.
            raise TransitionNotAllowed(standing.status, [SaleCarStatus.PUBLISHED])

        listing = await self._turn_back(listing_id, label, comment, moderator_id)
        await ComplaintService(self.db).settle_all(listing.sale_car_id, moderator_id)
        await self.db.commit()
        return await self.lifecycle.get(listing_id)

    async def _turn_back(
        self, listing_id: str, label: Optional[str], comment: Optional[str], moderator_id: str
    ) -> SaleCars:
        if label not in LABELS:
            raise RejectionNeedsReason()

        listing = await self.lifecycle.get(listing_id)
        listing = await self.lifecycle.move_to(listing, SaleCarStatus.REJECTED)
        listing.reject_label = label
        listing.reject_reason = (comment or "").strip() or None
        self._stamp(listing, moderator_id)
        await ListingDocumentService(self.db).discard(listing)
        await self.db.commit()
        return await self.lifecycle.get(listing_id)

    @staticmethod
    def _stamp(listing: SaleCars, moderator_id: str) -> None:
        listing.moderated_at = datetime.utcnow()
        listing.moderated_by = moderator_id

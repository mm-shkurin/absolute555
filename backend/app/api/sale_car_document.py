"""The registration document: a signed link, never the file and never the key."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.users import Users
from app.schemas.sale_cars import DocumentLink
from app.services.listing_errors import ListingError
from app.services.listing_document import ListingDocumentService
from app.services.listing_lifecycle import ListingLifecycleService
from app.utils.security import get_current_user

from .listing_http import listing_of, to_http

document_router = APIRouter()


@document_router.get("/{sale_car_id}/sts", response_model=DocumentLink)
async def get_document_link(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Owner and moderator only. Everyone else is told it is not there.

    So is a caller whose listing has already had its scan discarded after moderation --
    the three cases are indistinguishable from outside on purpose.
    """
    try:
        listing = await listing_of(ListingLifecycleService(db), sale_car_id, current_user)
        return await ListingDocumentService(db).signed_link(listing)
    except ListingError as error:
        raise to_http(error)

"""The registration document: attaching one, and a signed link back to it.

The scan arrives on its own. It is step one of the wizard, before the seller has named a
price -- the endpoint it replaces demanded price, mileage and a phone number with the
photograph and created the listing itself, which is a screen that does not exist.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.users import Users
from app.schemas.sale_cars import DocumentLink, StsAccepted
from app.services.listing_errors import ListingError
from app.services.listing_autofill import ListingAutofillService
from app.services.listing_document import ListingDocumentService
from app.services.listing_lifecycle import ListingLifecycleService
from app.utils.security import get_current_user

from .listing_http import listing_of, to_http
from .sale_car_view import autofill_view

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


@document_router.post(
    "/{sale_car_id}/sts",
    response_model=StsAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def attach_document(
    sale_car_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """Accepted, not done: the reading runs on the queue and reports back separately.

    A caller who does not own the listing is told it is not there, exactly as the link
    endpoint above does.
    """
    try:
        listing = await listing_of(ListingLifecycleService(db), sale_car_id, current_user)
        updated = await ListingAutofillService(db).attach_scan(
            listing, await file.read(), file.content_type or "image/jpeg"
        )
    except ListingError as error:
        raise to_http(error)
    return {"sale_car_id": updated.sale_car_id, "autofill": autofill_view(updated)}

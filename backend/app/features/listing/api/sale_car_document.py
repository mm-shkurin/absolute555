"""The registration document: attaching one, and a signed link back to it.

The scan arrives on its own. It is step one of the wizard, before the seller has named a
price -- the endpoint it replaces demanded price, mileage and a phone number with the
photograph and created the listing itself, which is a screen that does not exist.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status
from app.features.listing.deps import get_listing_autofill_service
from app.features.listing.deps import get_listing_document_service
from app.features.listing.services.listing_lifecycle import ListingLifecycleService

from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.schemas.sale_cars import DocumentLink, StsAccepted
from app.features.listing.services.listing_autofill import ListingAutofillService
from app.features.listing.services.listing_document import ListingDocumentService
from app.features.listing.services.photo_image import read_limited, require_image
from app.utils.security import get_current_user

from app.features.listing.services.listing_access_service import listing_of
from app.features.listing.api.autofill_target import accepted, autofill_target

document_router = APIRouter()


@document_router.get("/{sale_car_id}/sts", response_model=DocumentLink)
async def get_document_link(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    listing_document_service: ListingDocumentService = Depends(get_listing_document_service),
    current_user=Depends(get_current_user),
):
    """Owner and moderator only. Everyone else is told it is not there.

    So is a caller whose listing has already had its scan discarded after moderation --
    the three cases are indistinguishable from outside on purpose.
    """
    listing = await listing_of(listing_lifecycle_service, sale_car_id, current_user)
    return await listing_document_service.signed_link(listing)


@document_router.post(
    "/{sale_car_id}/sts",
    response_model=StsAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def attach_document(
    sale_car_id: str,
    file: UploadFile = File(...),
    listing=Depends(autofill_target),
    listing_autofill_service: ListingAutofillService = Depends(get_listing_autofill_service),
):
    """Accepted, not done: the reading runs on the queue and reports back separately.

    A caller who does not own the listing is told it is not there, exactly as the link
    endpoint above does.
    """
    body = await read_limited(file)
    detected = require_image(file.filename, body)
    updated = await listing_autofill_service.attach_scan(listing, body, detected)
    return accepted(updated)

"""The listing an autofill request reads into, resolved the same way for scan and VIN."""

from fastapi import Depends

from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.services.listing_access_service import listing_of
from app.shared.http.sale_car_view import autofill_view
from app.utils.security import get_current_user


async def autofill_target(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    return await listing_of(listing_lifecycle_service, sale_car_id, current_user)


def accepted(updated) -> dict:
    return {"sale_car_id": updated.sale_car_id, "autofill": autofill_view(updated)}

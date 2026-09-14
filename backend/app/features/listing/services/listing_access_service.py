"""Which listing a caller may learn exists."""

from app.features.listing.services.listing_errors import ListingNotFound
from app.features.listing.statuses import SaleCarStatus
from app.permissions.ownership import can_manage_sale_car

PUBLIC_STATUSES = frozenset({SaleCarStatus.PUBLISHED, SaleCarStatus.WITHDRAWN, SaleCarStatus.SOLD})


async def listing_of(service, sale_car_id: str, user):
    """The listing, if this caller is allowed to manage it.

    A caller who may not manage the listing is told it is not there rather than that it
    is forbidden: 403 confirms the identifier is real, which is the whole of what a
    scraper walking identifiers wants to learn.
    """
    listing = await service.get(sale_car_id)
    if not await can_manage_sale_car(user, str(listing.user_id)):
        raise ListingNotFound(sale_car_id)
    return listing


async def visible_listing(service, sale_car_id: str, user):
    """The listing, if this reader may see it: public, or managed by the reader."""
    listing = await service.get(sale_car_id)
    if listing.status not in PUBLIC_STATUSES and not (
        user is not None and await can_manage_sale_car(user, str(listing.user_id))
    ):
        raise ListingNotFound(sale_car_id)
    return listing

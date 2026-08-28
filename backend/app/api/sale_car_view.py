"""One shape for a listing on the wire.

Five endpoints assembled this dictionary field by field, identically, and a field added
to the model reached whichever of the five somebody remembered.
"""

from typing import Iterable, List

from app.models.sale_car import SaleCars
from app.services.s3_service import s3_service

_FIELDS = (
    "sale_car_id",
    "user_id",
    "vin",
    "mark_raw",
    "model_raw",
    "year",
    "transmission",
    "engine_power",
    "s3_photo_car_keys",
    "task_id",
    "task_status",
    "phone_number",
    "price",
    "milleage",
    "description",
    "status",
    "reject_reason",
    "published_at",
    "created_at",
    "updated_at",
)


async def to_view(listing: SaleCars) -> dict:
    view = {name: getattr(listing, name) for name in _FIELDS}
    view["brand"] = listing.brand.name_ru if listing.brand else None
    view["model"] = listing.model.name if listing.model else None

    keys = listing.s3_photo_car_keys or []
    if keys:
        try:
            view["preview_photo_url"] = await s3_service.generate_presigned_url(keys[0])
        except Exception:
            # A listing with an unreachable photo store is still a listing worth showing.
            pass
    return view


async def to_views(listings: Iterable[SaleCars]) -> List[dict]:
    return [await to_view(listing) for listing in listings]

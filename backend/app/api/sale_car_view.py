"""One shape for a listing on the wire.

Five endpoints assembled this dictionary field by field, identically, and a field added
to the model reached whichever of the five somebody remembered.
"""

from typing import Iterable, List

from app.models.sale_car import SaleCars
from app.core.config import PhotoSettings
from app.services.s3_service import s3_service

photo_settings = PhotoSettings()

_FIELDS = (
    "sale_car_id",
    "user_id",
    "vin",
    "mark_raw",
    "model_raw",
    "year",
    "transmission",
    "engine_power",
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


def autofill_view(listing: SaleCars) -> dict:
    """The outcome of the reading, and who filled the two catalogue fields."""
    return {
        "state": listing.autofill_state,
        "brand_source": listing.brand_source,
        "model_source": listing.model_source,
        "updated_at": listing.autofill_updated_at,
    }


def _photo_view(photo: dict) -> dict:
    # An old photograph carried over by the migration has no preview of its own; the
    # original stands in for it until someone re-uploads.
    preview = photo.get("preview_key") or photo["key"]
    return {
        "photo_id": photo["photo_id"],
        "url": s3_service.get_public_photo_url(photo["key"]),
        "preview_url": s3_service.get_public_photo_url(preview),
    }


async def to_view(listing: SaleCars) -> dict:
    view = {name: getattr(listing, name) for name in _FIELDS}
    view["brand"] = listing.brand.name_ru if listing.brand else None
    view["model"] = listing.model.name if listing.model else None

    view["autofill"] = autofill_view(listing)

    photos = [_photo_view(photo) for photo in (listing.photos or [])]
    view["photos"] = photos
    view["preview_photo_url"] = photos[0]["preview_url"] if photos else None
    return view


def to_gallery(listing: SaleCars) -> dict:
    return {
        "sale_car_id": listing.sale_car_id,
        "photos": [_photo_view(photo) for photo in (listing.photos or [])],
        "limit": photo_settings.max_photos_per_listing,
    }


async def to_views(listings: Iterable[SaleCars]) -> List[dict]:
    return [await to_view(listing) for listing in listings]

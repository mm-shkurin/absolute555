"""One shape for a listing on the wire.

Five endpoints assembled this dictionary field by field, identically, and a field added
to the model reached whichever of the five somebody remembered.
"""

from typing import Iterable, List, Optional

from app.features.listing.models.sale_car import SaleCars
from app.core.config import PhotoSettings
from app.shared.storage.s3_service import s3_service

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
    "reject_label",
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


def seller_view(owner) -> Optional[dict]:
    """Who is selling: a name and a face, nothing that identifies them off-platform.

    The name comes from whatever provider the seller signed in with. A guest has none,
    and the screen says so rather than inventing one.
    """
    if owner is None:
        return None

    profile = owner.yandex_json if isinstance(owner.yandex_json, dict) else {}
    name = " ".join(
        part for part in (profile.get("first_name"), profile.get("last_name")) if part
    ).strip()
    return {
        "user_id": owner.id,
        "name": name or None,
        "avatar_url": None,
        "rating": owner.rating_avg,
        "reviews_count": owner.reviews_count or 0,
        "deals_count": owner.deals_count or 0,
    }


async def to_view(listing: SaleCars, viewer=None) -> dict:
    """One listing, as the caller in front of it may see it.

    The phone number is the one field that depends on who is asking: it is the seller's
    personal number, and a payload carrying it to everyone is one scrape away from every
    number on the platform (story 8).
    """
    view = {name: getattr(listing, name) for name in _FIELDS}
    view["brand"] = listing.brand.name_ru if listing.brand else None
    view["model"] = listing.model.name if listing.model else None

    view["autofill"] = autofill_view(listing)

    if not _may_read_phone(listing, viewer):
        view["phone_number"] = None
    view["seller"] = seller_view(getattr(listing, "owner", None))

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


def _may_read_phone(listing: SaleCars, viewer) -> bool:
    if viewer is None:
        return False
    return str(viewer.id) == str(listing.user_id) or viewer.role in ("manager", "admin")


def to_card(listing: SaleCars) -> dict:
    """A listing as the feed shows it.

    Deliberately not `to_view` with fields removed: the feed answers twenty at a time,
    and a field added to the card view would silently be added twenty-fold here.
    """
    photos = [_photo_view(photo) for photo in (listing.photos or [])]
    return {
        "sale_car_id": listing.sale_car_id,
        "brand": listing.brand.name_ru if listing.brand else None,
        "model": listing.model.name if listing.model else None,
        "year": listing.year,
        "price": listing.price,
        "milleage": listing.milleage,
        "transmission": listing.transmission,
        "status": listing.status,
        "preview_photo_url": photos[0]["preview_url"] if photos else None,
        "published_at": listing.published_at.isoformat() if listing.published_at else None,
    }


async def to_views(listings: Iterable[SaleCars], viewer=None) -> List[dict]:
    return [await to_view(listing, viewer) for listing in listings]

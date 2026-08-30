"""Attaching photographs to a listing's gallery.

Story 4 needs exactly one thing from a photo: that the listing has one, because the
submit gate refuses a listing with an empty gallery. Ordering, the cover shot and the
fifteen-photo ceiling are story 5 and are deliberately not here.

Until this existed, POST /sale_car/{id}/photos appended to sts_photos -- the СТС document
scans -- so nothing in the API could fill the gallery the gate reads, and no listing
could be submitted at all.
"""

import base64
import binascii
from typing import List

from app.models.sale_car import SaleCars
from app.services.listing_errors import ListingError
from app.services.s3_service import s3_service


class PhotoNotReadable(ListingError):
    def __init__(self):
        super().__init__("a photo could not be read as base64 image data")


async def attach(db, listing: SaleCars, photos_b64: List[str]) -> SaleCars:
    keys = list(listing.s3_photo_car_keys or [])

    for encoded in photos_b64:
        keys.append(
            await s3_service.upload_file_get_key_from_bytes(
                str(listing.sale_car_id), _decode(encoded)
            )
        )

    listing.s3_photo_car_keys = keys
    await db.commit()
    await db.refresh(listing, attribute_names=["s3_photo_car_keys", "updated_at"])
    return listing


def _decode(encoded: str) -> bytes:
    # A data: URI is what a browser's FileReader hands the client, so accept both it and
    # the bare payload rather than making every caller strip the prefix.
    payload = encoded.split(",", 1)[1] if encoded.startswith("data:") else encoded
    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        raise PhotoNotReadable()

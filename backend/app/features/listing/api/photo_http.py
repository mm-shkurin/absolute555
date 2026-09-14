"""Where a refused image upload becomes an HTTP error, outside a listing's gallery."""

from contextlib import contextmanager

from app.core.exceptions import PayloadTooLarge, ValidationError
from app.features.listing.services.photo_errors import NotAnImage, PhotoTooLarge


@contextmanager
def image_upload(filename: str):
    """Translate the image refusals raised inside the block; `filename` names the field."""
    try:
        yield
    except PhotoTooLarge as error:
        raise PayloadTooLarge(
            str(error),
            code="PHOTO_TOO_LARGE",
            details={"limit_bytes": error.limit, "size_bytes": error.size},
        )
    except NotAnImage as error:
        raise ValidationError(str(error), code="NOT_AN_IMAGE", details={"filename": filename})

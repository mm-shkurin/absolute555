"""An image upload refused under the name of the field it came in, not of the file."""

from contextlib import contextmanager

from app.features.listing.services.photo_errors import NotAnImage


@contextmanager
def image_upload(field: str):
    try:
        yield
    except NotAnImage as error:
        raise NotAnImage(field) from error

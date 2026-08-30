"""Reading an uploaded file as an image, and making the small copy the feed shows.

Previews are built in the request rather than on Celery. Resizing a ten-megabyte photo is
a few hundred milliseconds, and at tens of listings a day that is cheaper than a "preview
not ready yet" state the feed, the listing card and My Listings would each have to render.
"""

from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.core.config import PhotoSettings

photo_settings = PhotoSettings()


def is_image(body: bytes) -> bool:
    """Whether these bytes are an image, judged by the bytes alone."""
    try:
        with Image.open(BytesIO(body)) as image:
            image.verify()
        return True
    except (UnidentifiedImageError, OSError, ValueError):
        return False


def build_preview(body: bytes) -> bytes:
    """A JPEG no wider or taller than the configured edge."""
    with Image.open(BytesIO(body)) as image:
        image = image.convert("RGB")
        image.thumbnail(
            (photo_settings.preview_max_edge, photo_settings.preview_max_edge),
            Image.LANCZOS,
        )
        out = BytesIO()
        image.save(out, format="JPEG", quality=82, optimize=True)
    return out.getvalue()

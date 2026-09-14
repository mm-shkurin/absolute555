"""Reading an uploaded file as an image, and making the small copy the feed shows.

Previews are built in the request rather than on the queue. Resizing a ten-megabyte photo is
a few hundred milliseconds, and at tens of listings a day that is cheaper than a "preview
not ready yet" state the feed, the listing card and My Listings would each have to render.
"""

from io import BytesIO
from typing import Optional

from PIL import Image, UnidentifiedImageError

from app.core.config_getters import get_photo_settings
from app.features.listing.services.photo_errors import NotAnImage, PhotoTooLarge

READ_CHUNK = 64 * 1024


async def read_limited(upload, max_bytes: Optional[int] = None) -> bytes:
    """Read an upload in chunks, refusing it the moment it passes the limit.

    Reading it whole first would let a client hold a worker's memory hostage with a file
    of any size before the limit is ever consulted.
    """
    limit = get_photo_settings().max_photo_bytes if max_bytes is None else max_bytes
    chunks, size = [], 0
    while chunk := await upload.read(READ_CHUNK):
        size += len(chunk)
        if size > limit:
            raise PhotoTooLarge(limit=limit, size=size)
        chunks.append(chunk)
    return b"".join(chunks)


def image_type(body: bytes) -> Optional[str]:
    """The MIME type these bytes are an image of, or None when they are not one."""
    try:
        with Image.open(BytesIO(body)) as image:
            kind = image.format or "jpeg"
            image.verify()
        return Image.MIME.get(kind) or f"image/{kind.lower()}"
    except (UnidentifiedImageError, OSError, ValueError):
        return None


def is_image(body: bytes) -> bool:
    """Whether these bytes are an image, judged by the bytes alone."""
    return image_type(body) is not None


def require_image(filename: str, body: bytes) -> str:
    """Refuse an upload that is too heavy or is not an image; return its detected type.

    The content decides, not the extension and not the declared type — a client supplies
    both, so neither is evidence of anything.
    """
    if len(body) > get_photo_settings().max_photo_bytes:
        raise PhotoTooLarge(limit=get_photo_settings().max_photo_bytes, size=len(body))
    detected = image_type(body)
    if detected is None:
        raise NotAnImage(filename)
    return detected


def build_preview(body: bytes) -> bytes:
    """A JPEG no wider or taller than the configured edge."""
    with Image.open(BytesIO(body)) as image:
        image = image.convert("RGB")
        image.thumbnail(
            (get_photo_settings().preview_max_edge, get_photo_settings().preview_max_edge),
            Image.LANCZOS,
        )
        out = BytesIO()
        image.save(out, format="JPEG", quality=82, optimize=True)
    return out.getvalue()

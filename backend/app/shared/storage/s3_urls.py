"""Addresses of stored objects: from a key to the link a browser opens."""

from app.core.config import MinioSettings


def public_photo_url(settings: MinioSettings, key: str) -> str:
    # The address a browser reaches the gallery at, which is not the address this
    # process talks to MinIO on.
    return f"{settings.public_photo_base_url.rstrip('/')}/{key}"

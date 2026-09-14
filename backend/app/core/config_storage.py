"""Settings of the stores: Redis, object storage, and the limits on what goes into them."""

from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings

from app.core.config import BaseConfig


class RedisSettings(BaseSettings):
    redis_network_name: str = Field(..., alias="REDIS_NETWORK_NAME")
    redis_port: int = Field(..., ge=1, le=65535, alias="REDIS_PORT")
    redis_password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")
    redis_user: Optional[str] = Field(default=None, alias="REDIS_USER")
    redis_user_password: Optional[str] = Field(default=None, alias="REDIS_USER_PASSWORD")
    redis_ttl: int = Field(alias="REDIS_TTL")
    model_config = BaseConfig.model_config

class MinioSettings(BaseSettings):
    minio_root_user: str = Field(..., min_length=1, alias="MINIO_ROOT_USER")
    minio_root_password: str = Field(..., min_length=1, alias="MINIO_ROOT_PASSWORD")
    minio_default_buckets: str = Field(..., min_length=1, alias="MINIO_DEFAULT_BUCKETS")
    minio_network_name: str = Field(..., alias="MINIO_NETWORK_NAME")
    minio_port: int = Field(..., ge=1, le=65535, alias="MINIO_PORT")
    minio_endpoint_url: Optional[str] = Field(None, alias="MINIO_ENDPOINT_URL")
    minio_bucket_name: str = Field(..., min_length=1, alias="MINIO_BUCKET_NAME")

    # Two stores, not one bucket with a policy per prefix. A typo in a prefix exposes a
    # registration document silently; the wrong bucket is visible at once.
    minio_documents_bucket: str = Field("absolute-documents", alias="MINIO_DOCUMENTS_BUCKET")

    # Where a browser reaches the gallery.
    public_photo_base_url: str = Field("http://localhost:9000/absolute", alias="PUBLIC_PHOTO_BASE_URL")

    model_config = BaseConfig.model_config


class PhotoSettings(BaseSettings):
    max_photos_per_listing: int = Field(15, alias="MAX_PHOTOS_PER_LISTING")
    max_photo_bytes: int = Field(10 * 1024 * 1024, alias="MAX_PHOTO_BYTES")
    min_photos_to_submit: int = Field(3, alias="MIN_PHOTOS_TO_SUBMIT")
    preview_max_edge: int = Field(800, alias="PREVIEW_MAX_EDGE")
    document_link_ttl_seconds: int = Field(300, alias="DOCUMENT_LINK_TTL_SECONDS")

    model_config = BaseConfig.model_config


class ThicknessSettings(BaseSettings):
    """Микроны. Заводское покрытие держится в сотне с небольшим; выше порога перекраса —
    слой поверх заводского, выше порога шпаклёвки — только шпаклёвка. За пределом
    допустимого число пришло не от прибора."""

    repaint_from_um: int = Field(200, gt=0, alias="THICKNESS_REPAINT_FROM_UM")
    filler_from_um: int = Field(500, gt=0, alias="THICKNESS_FILLER_FROM_UM")
    max_value_um: int = Field(3000, gt=0, alias="THICKNESS_MAX_VALUE_UM")

    model_config = BaseConfig.model_config

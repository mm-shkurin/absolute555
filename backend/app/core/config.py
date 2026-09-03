from typing import Optional, ClassVar
from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings
from enum import Enum

class BaseConfig(BaseSettings):
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name":True 
    }

class LogLevel(str, Enum):
    DEBUG = "debug"  
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class CompressionType(str, Enum):
    GZIP = "gz"
    BZIP2 = "bz2"
    ZIP = "zip"

class AppSettings(BaseSettings):
    app_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        alias="APP_NAME" 
    )
    app_port: int = Field(
        ...,
        ge=1,
        le=65535,
        alias="APP_PORT" 
    )
    
    app_host: str = Field(default="0.0.0.0")
    app_reload: bool = Field(default=False)
    app_log_level: LogLevel = Field(default=LogLevel.INFO)
    log_format: str = Field(default="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}")
    log_file: str = Field(default="logs/app.log")
    log_rotation: str = Field(default="1 day")
    log_compression: CompressionType = Field(default=CompressionType.GZIP)
    
    model_config = BaseConfig.model_config
class DatabaseSettings(BaseSettings):
    postgres_network_name: str = Field(..., alias="POSTGRES_NETWORK_NAME")
    postgres_user: str = Field(..., min_length=1, alias="POSTGRES_USER")
    postgres_password: str = Field(..., min_length=1, alias="POSTGRES_PASSWORD")
    postgres_db: str = Field(..., min_length=1, alias="POSTGRES_DB")
    postgres_host: str = Field(default="localhost", alias="POSTGRES_HOST")
    postgres_port: int = Field(..., ge=1, le=65535, alias="POSTGRES_PORT")
    debug_sql: bool = Field(default=False)

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    model_config = BaseConfig.model_config
    
class DocsSettings(BaseSettings):
    docs_api_key: str = Field(..., alias="DOCS_API_KEY")
    
    model_config = BaseConfig.model_config
class JWTSettings(BaseSettings):
    secret_key: str = Field(..., min_length=32, alias="SECRET_KEY")
    refresh_token_secret_key: str = Field(..., min_length=32, alias="REFRESH_TOKEN_SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(..., alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(..., alias="REFRESH_TOKEN_EXPIRE_MINUTES")
    
    model_config = BaseConfig.model_config

class YandexSettings(BaseSettings):
    yandex_clientid: str = Field(..., min_length=32, alias="YANDEX_CLIENTID")
    yandex_client_secret: str = Field(..., min_length=32, alias="YANDEX_CLIENT_SECRET")
    yandex_redirect_uri: HttpUrl = Field(..., alias="YANDEX_REDIRECT_URI")
    yandex_redirect_uri_web: HttpUrl = Field(..., alias="YANDEX_REDIRECT_URI_WEB")
    model_config = BaseConfig.model_config

class OAuthSettings(BaseSettings):
    """The sign-in handshake, apart from the provider's own credentials.

    `oauth_provider` is `fake` in tests: the flow's own rules -- a state good once, a
    handoff code good once, an account created on first sign-in -- are the subject, and
    they cannot be exercised against a provider that requires a browser and a human.
    """

    oauth_provider: str = Field(default="yandex", alias="OAUTH_PROVIDER")
    oauth_frontend_callback_url: str = Field(
        default="http://localhost:3000/auth/callback", alias="OAUTH_FRONTEND_CALLBACK_URL"
    )
    # Minutes, not hours: a state is alive only while a person is on the provider's
    # consent screen, and a handoff code only while the browser is being redirected back.
    oauth_state_ttl_seconds: int = Field(default=600, alias="OAUTH_STATE_TTL_SECONDS")
    oauth_handoff_ttl_seconds: int = Field(default=120, alias="OAUTH_HANDOFF_TTL_SECONDS")

    model_config = BaseConfig.model_config


# VKSettings lived here. VK OAuth left the repository with its router: the flow needs a
# VK business account this project does not have, so the settings only demanded secrets
# for a provider nothing could call.
class OfferSettings(BaseSettings):
    """How long a price offer stands.

    Three days is a hypothesis about how fast people answer, not a fact about selling
    cars, so it is a setting: it will be moved by watching what sellers actually do.
    """

    offer_life_hours: int = Field(default=72, alias="OFFER_LIFE_HOURS")

    model_config = BaseConfig.model_config


class FrontendSettings(BaseSettings):
    frontend_url: HttpUrl = Field(..., alias="FRONTEND_URL")
    
    model_config = BaseConfig.model_config
class CookieSettings(BaseSettings):
    access_cookie_name: str = Field(default="access_token", alias="ACCESS_COOKIE_NAME")
    refresh_cookie_name: str = Field(default="refresh_token", alias="REFRESH_COOKIE_NAME")
    cookie_domain: str = Field(..., alias="COOKIE_DOMAIN")
    cookie_path: str = Field(default="/", alias="COOKIE_PATH")
    cookie_secure: bool = Field(default=True, alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="none", alias="COOKIE_SAMESITE") 
    
    model_config = BaseConfig.model_config
class CORSSettings(BaseSettings):
    cors_origins: str = Field(..., alias="CORS_ORIGINS") 
    
    model_config = BaseConfig.model_config
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
    minio_endpoint_url: str = Field(..., alias="MINIO_ENDPOINT_URL")
    minio_bucket_name: str = Field(..., min_length=1, alias="MINIO_BUCKET_NAME")

    # Two stores, not one bucket with a policy per prefix. A typo in a prefix exposes a
    # registration document silently; the wrong bucket is visible at once.
    minio_documents_bucket: str = Field("absolute-documents", alias="MINIO_DOCUMENTS_BUCKET")

    # Where a browser reaches the gallery. Hardcoded in s3_service until story 5.
    public_photo_base_url: str = Field(..., alias="PUBLIC_PHOTO_BASE_URL")

    model_config = BaseConfig.model_config


class PhotoSettings(BaseSettings):
    max_photos_per_listing: int = Field(15, alias="MAX_PHOTOS_PER_LISTING")
    max_photo_bytes: int = Field(10 * 1024 * 1024, alias="MAX_PHOTO_BYTES")
    min_photos_to_submit: int = Field(3, alias="MIN_PHOTOS_TO_SUBMIT")
    preview_max_edge: int = Field(800, alias="PREVIEW_MAX_EDGE")
    document_link_ttl_seconds: int = Field(300, alias="DOCUMENT_LINK_TTL_SECONDS")

    model_config = BaseConfig.model_config

class WebhookSettings(BaseSettings):
    webhook_secret: str = Field(..., alias="WEBHOOK_SECRET")
    tg_webhook_url: Optional[HttpUrl] = Field(None, alias="TG_WEBHOOK_URL")

    model_config = BaseConfig.model_config

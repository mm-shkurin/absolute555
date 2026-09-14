"""One settings object per process, built on first use rather than at import.

Importing a module must not require the environment to be complete. Tests that change
the environment call `get_x.cache_clear()` so the next read sees it.
"""

from functools import lru_cache

from app.core.config import (
    AdminSettings,
    CookieSettings,
    DocsSettings,
    FrontendSettings,
    JWTSettings,
    MinioSettings,
    OAuthSettings,
    OfferSettings,
    OutboundHttpSettings,
    PhotoSettings,
    RedisSettings,
    ThicknessSettings,
    WebhookSettings,
    YandexSettings,
)


@lru_cache
def get_admin_settings() -> AdminSettings:
    return AdminSettings()


@lru_cache
def get_cookie_settings() -> CookieSettings:
    return CookieSettings()


@lru_cache
def get_docs_settings() -> DocsSettings:
    return DocsSettings()


@lru_cache
def get_frontend_settings() -> FrontendSettings:
    return FrontendSettings()


@lru_cache
def get_jwt_settings() -> JWTSettings:
    return JWTSettings()


@lru_cache
def get_minio_settings() -> MinioSettings:
    return MinioSettings()


@lru_cache
def get_oauth_settings() -> OAuthSettings:
    return OAuthSettings()


@lru_cache
def get_offer_settings() -> OfferSettings:
    return OfferSettings()


@lru_cache
def get_photo_settings() -> PhotoSettings:
    return PhotoSettings()


@lru_cache
def get_redis_settings() -> RedisSettings:
    return RedisSettings()


@lru_cache
def get_thickness_settings() -> ThicknessSettings:
    return ThicknessSettings()


@lru_cache
def get_webhook_settings() -> WebhookSettings:
    return WebhookSettings()


@lru_cache
def get_yandex_settings() -> YandexSettings:
    return YandexSettings()


@lru_cache
def get_outbound_http_settings() -> OutboundHttpSettings:
    return OutboundHttpSettings()

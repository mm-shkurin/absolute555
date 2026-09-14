"""The one way this backend opens an HTTP client to a third party."""

import httpx

from app.core.config_getters import get_outbound_http_settings


def outbound_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=get_outbound_http_settings().outbound_http_timeout_seconds)

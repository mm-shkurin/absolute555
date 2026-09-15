import hmac
from pathlib import Path

from fastapi import APIRouter, Form, Request
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

from app.core.config_getters import get_docs_settings
from app.core.exceptions import AuthenticationError
from app.shared import docs_sessions

COOKIE = "docs_session"

docs_router = APIRouter()
templates = Jinja2Templates(directory=Path(__file__).parent / "templates")


def _key_matches(api_key: str | None) -> bool:
    expected = get_docs_settings().docs_api_key
    return bool(api_key) and hmac.compare_digest(api_key.encode(), expected.encode())


def _login_page(request: Request, title: str, action: str):
    return templates.TemplateResponse(
        request, "docs/login.html", {"title": title, "action": action}
    )


async def _login(request: Request, api_key: str, entry: str, viewer: str):
    if not _key_matches(api_key):
        return templates.TemplateResponse(
            request,
            "docs/error.html",
            {"error_message": "Неверный API ключ!", "redirect_url": entry},
            status_code=401,
        )
    response = RedirectResponse(url=viewer, status_code=302)
    response.set_cookie(
        key=COOKIE,
        value=await docs_sessions.open_session(),
        max_age=get_docs_settings().docs_session_ttl_seconds,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    return response


@docs_router.get("/docs", include_in_schema=False)
async def docs_login_page(request: Request):
    return _login_page(request, "Swagger UI", "/docs/auth")


@docs_router.post("/docs/auth", include_in_schema=False)
async def docs_auth(request: Request, api_key: str = Form()):
    return await _login(request, api_key, "/docs", "/docs/swagger")


@docs_router.get("/docs/swagger", include_in_schema=False)
async def get_swagger_ui_documentation(request: Request):
    if not await docs_sessions.is_open(request.cookies.get(COOKIE)):
        return RedirectResponse(url="/docs", status_code=302)
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Absolute API - Swagger UI")


@docs_router.get("/redoc", include_in_schema=False)
async def redoc_login_page(request: Request):
    return _login_page(request, "ReDoc", "/redoc/auth")


@docs_router.post("/redoc/auth", include_in_schema=False)
async def redoc_auth(request: Request, api_key: str = Form()):
    return await _login(request, api_key, "/redoc", "/redoc/view")


@docs_router.get("/redoc/view", include_in_schema=False)
async def get_redoc_documentation(request: Request):
    if not await docs_sessions.is_open(request.cookies.get(COOKIE)):
        return RedirectResponse(url="/redoc", status_code=302)
    return get_redoc_html(openapi_url="/openapi.json", title="Absolute API - ReDoc")


@docs_router.get("/openapi.json", include_in_schema=False)
async def get_openapi_schema(request: Request):
    allowed = await docs_sessions.is_open(request.cookies.get(COOKIE)) or _key_matches(
        request.headers.get("X-API-Key")
    )
    if not allowed:
        raise AuthenticationError("Unauthorized", code="DOCS_KEY_INVALID")
    app = request.app
    return get_openapi(
        title=app.title, version=app.version, description=app.description, routes=app.routes
    )

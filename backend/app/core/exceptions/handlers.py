"""Turning every failure into the one envelope.

Four handlers, because four kinds of thing go wrong: an error the application raised on
purpose, an HTTPException raised by FastAPI itself or by code not yet converted, a
request that failed validation before any handler ran, and everything unforeseen.
"""

from fastapi.exceptions import RequestValidationError
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.exceptions import HTTPException as StarletteHTTPException

from .base import BaseErrorApp

STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "PERMISSION_DENIED",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    422: "VALIDATION_ERROR",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
    502: "EXTERNAL_SERVICE_ERROR",
}


async def app_error_handler(request: Request, exc: BaseErrorApp):
    logger.warning(f"{exc.code}: {exc.message} details={exc.details}")
    return JSONResponse(status_code=exc.http_status, content=exc.to_payload())


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """An HTTPException, wearing the same envelope as everything else.

    A `detail` that is already a dict carries its own fields -- the lifecycle refusals
    do this -- so it becomes `details` rather than being stringified into `message`.
    """
    code = STATUS_CODES.get(exc.status_code, f"HTTP_{exc.status_code}")
    if isinstance(exc.detail, dict):
        message = exc.detail.get("detail") or code
        details = {k: v for k, v in exc.detail.items() if k != "detail"}
    else:
        message = str(exc.detail)
        details = {}

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": message, "code": code, "details": details},
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {
            "field": " → ".join(str(part) for part in error["loc"] if part != "body") or "body",
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]
    logger.warning(f"VALIDATION_ERROR: {len(errors)} problems in {request.url.path}")

    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": "The request is not valid",
            "code": "VALIDATION_ERROR",
            "details": {"errors": errors},
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    # 500, not 503: an unforeseen exception says nothing about whether the service is
    # up, and answering 503 tells a client to retry a request that will fail again.
    logger.opt(exception=exc).error(f"Unhandled exception on {request.url.path}")

    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal error",
            "code": "INTERNAL_ERROR",
            "details": {},
        },
    )


def register_exception_handlers(app) -> None:
    app.add_exception_handler(BaseErrorApp, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

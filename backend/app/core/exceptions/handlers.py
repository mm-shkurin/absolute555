from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from typing import Any, Dict

from .base import BaseErrorApp

logger = logging.getLogger(__name__)

async def base_error_app_handler(request: Request, exc: BaseErrorApp):
    code = exc.code or "UNKNOWN_ERROR"
    logger.warning(f"{code}: {exc.message} details={exc.details}")
    
    return JSONResponse(
        status_code=exc.http_status,
        content={
            "error": True,
            "message": exc.message,
            "code": code,
            "details": exc.details or {}
        },
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
    }
    
    code = error_codes.get(exc.status_code, f"HTTP_{exc.status_code}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "code": code,
            "details": {}
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field_path = " → ".join([str(loc) for loc in err["loc"] if loc != "body"])
        errors.append({
            "field": field_path or "body",
            "message": err["msg"],
            "type": err["type"]
        })
    
    logger.warning(f"ValidationError: {len(errors)} errors found")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": "Validation error",
            "code": "VALIDATION_ERROR",
            "details": {"errors": errors},
        },
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=503,
        content={
            "error": True,
            "message": "Service temporarily unavailable",
            "code": "SERVICE_UNAVAILABLE",
            "details": {"type": exc.__class__.__name__},
        },
    )

def register_exception_handlers(app):
    app.add_exception_handler(BaseErrorApp, base_error_app_handler)
    
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
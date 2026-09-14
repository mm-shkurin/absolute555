from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from loguru import logger
from pydantic import ValidationError

from app.api import api_router
from app.core.config import AppSettings, CORSSettings
from app.core.exceptions import register_exception_handlers
from app.docs import docs_router


def setup_logging(settings: AppSettings) -> None:
    logger.add(
        settings.log_file,
        rotation=settings.log_rotation,
        compression=settings.log_compression.value,
        format=settings.log_format,
    )


def add_cors(app: FastAPI) -> None:
    try:
        cors_settings = CORSSettings()
    except ValidationError as error:
        logger.warning("CORS is not configured, cross-origin requests are refused: {}", error)
        return
    origins = [o.strip() for o in cors_settings.cors_origins.split(",") if o.strip()]
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


def add_probes(app: FastAPI) -> None:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to API Absolute"}

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}


def create_app() -> FastAPI:
    settings = AppSettings()
    app = FastAPI(
        title=settings.app_name,
        description="API for Absolute application",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    setup_logging(settings)
    add_cors(app)

    # Every failure leaves through one envelope -- error/message/code/details -- so a
    # client branches on a code instead of parsing prose. Registered before the routers
    # so nothing can answer in another shape.
    register_exception_handlers(app)
    add_probes(app)

    # /api/v1 is the prefix ProductSpecification/technology.md declares and the frontend
    # nginx proxies. OAuth redirect URIs registered with Yandex must match it.
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(docs_router)

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

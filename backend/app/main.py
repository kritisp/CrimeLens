"""
CrimeLens AI — FastAPI Application Factory

Bootstrap and configuration for the FastAPI application.

It is responsible for:
  1. Setting up the lifecycles (startup & shutdown context managers)
  2. Initializing logging configurations
  3. Configuring CORS middleware for frontend communication
  4. Wiring custom global exception handlers for Clean Architecture errors
  5. Registering versioned routers
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import CrimeLensException
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)


async def load_signatures_and_warm_up_ml() -> None:
    """
    Background worker that initializes the database, loads the crime signatures,
    and warms up the FAISS embedding index asynchronously. Prevents AppSail boot timeouts.
    """
    import asyncio
    try:
        from app.core.dependencies import init_db, load_signatures_from_db, get_pipeline_executor
        logger.info("bg_db_initialization_started")
        await init_db()
        logger.info("bg_db_initialization_completed")

        logger.info("bg_signatures_load_started")
        await load_signatures_from_db()
        logger.info("bg_signatures_load_completed")

        logger.info("bg_ml_models_load_started")
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, get_pipeline_executor)
        logger.info("bg_ml_models_load_completed")
    except Exception as exc:
        logger.exception("bg_lifespan_startup_failed", error=str(exc))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Asynchronous context manager governing startup and shutdown hooks.

    Guarantees execution of critical setup items before requests are handled,
    and graceful teardown when shutting down.
    """
    settings = get_settings()

    # 1. Initialize logging
    configure_logging(
        log_level=settings.log_level,
        json_logs=settings.log_json,
    )
    logger.info(
        "app_startup_initiated",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        debug=settings.debug,
    )

    # 2. Spawn background task to initialize DB and warm up ML models without blocking boot
    import asyncio
    asyncio.create_task(load_signatures_and_warm_up_ml())

    yield

    # 3. Graceful shutdown hooks
    logger.info("app_shutdown_initiated")
    logger.info("app_shutdown_completed")


def create_app() -> FastAPI:
    """
    Application factory pattern.

    Creates and configures the FastAPI application instance. Avoids using a
    global app instance to enable clean unit testing, mocking, and multiple
    instances.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Crime Intelligence & Decision Support Platform for Karnataka State Police",
        version=settings.app_version,
        docs_url=settings.api_v1_prefix + "/docs" if settings.docs_enabled else None,
        redoc_url=settings.api_v1_prefix + "/redoc" if settings.docs_enabled else None,
        openapi_url=settings.api_v1_prefix + "/openapi.json" if settings.docs_enabled else None,
        lifespan=lifespan,
    )

    # ── CORS Middleware ───────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Timing and ID Middleware ──────────────────────────────────────────────
    from app.api.v1.middleware.timing import TimingAndIDMiddleware
    app.add_middleware(TimingAndIDMiddleware)


    # ── Exception Handlers ────────────────────────────────────────────────────
    @app.exception_handler(CrimeLensException)
    async def crimelens_exception_handler(request: Request, exc: CrimeLensException) -> JSONResponse:
        """
        Global handler for clean application exceptions.

        Catches domain exceptions and maps them to clean HTTP responses,
        preventing stack trace leakage to client.
        """
        logger.error(
            "app_exception_handled",
            exception_type=type(exc).__name__,
            message=exc.message,
            status_code=exc.status_code,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "type": type(exc).__name__,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Fallback exception handler for unhandled framework/stdlib errors.
        """
        logger.exception(
            "unhandled_exception_caught",
            error=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected server error occurred. Please contact system administrators.",
                "type": "InternalServerError",
            },
        )

    # ── Route Mount ───────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("salvex.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for startup and shutdown procedures."""
    logger.info(f"Starting Salvex API in {settings.APP_ENV} mode...")
    logger.info(f"Configured CORS origins: {settings.cors_origins}")
    yield
    logger.info("Shutting down Salvex API...")


def create_application() -> FastAPI:
    """FastAPI Application factory configuring middleware, lifespan, and routers."""
    app = FastAPI(
        title="Salvex Auction Platform API",
        description="Unified Enterprise Auction API for Web (React) and Mobile (Flutter)",
        version="1.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        lifespan=lifespan
    )

    # Restrictive CORS configuration — explicitly configured frontend origins only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Mount API routers
    app.include_router(health_router)
    app.include_router(auth_router)

    return app


app = create_application()

"""
WashWise AI Worker - Main Application
"""
import structlog
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.config import get_settings
from app.routes import chat_router, health_router, intents_router
from app.services.redis_client import get_redis_client
from app.services.mongodb_client import get_mongodb_client

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(structlog.stdlib.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    logger.info("Starting AI Worker service", environment=settings.environment)
    
    # Initialize Redis
    redis = await get_redis_client()
    await redis.ping()
    logger.info("Redis connection established")
    
    # Initialize MongoDB
    mongo = await get_mongodb_client()
    await mongo.admin.command("ping")
    logger.info("MongoDB connection established")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Worker service")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="WashWise AI Worker",
        description="AI-powered assistant for WashWise Smart Laundromat Platform",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure properly in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(health_router, tags=["Health"])
    app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])
    app.include_router(intents_router, prefix="/api/v1", tags=["Intents"])

    # Prometheus metrics
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

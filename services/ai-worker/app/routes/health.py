"""
Health check routes for AI Worker
"""
from datetime import datetime
from enum import Enum
from typing import Any

import structlog
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.mongodb_client import get_mongodb_client
from app.services.redis_client import get_redis_client

logger = structlog.get_logger()
router = APIRouter(tags=["Health"])


class HealthStatus(str, Enum):
    """Health status enumeration."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentHealth(BaseModel):
    """Health status of a component."""
    status: HealthStatus
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: HealthStatus
    timestamp: datetime
    version: str = "2.0.0"
    components: dict[str, ComponentHealth]


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Check the health of the AI Worker service and its dependencies.
    
    Returns:
        HealthResponse: Overall health status and component details
    """
    import time
    
    components: dict[str, ComponentHealth] = {}
    overall_status = HealthStatus.HEALTHY
    
    # Check Redis
    try:
        redis = await get_redis_client()
        start = time.time()
        await redis.ping()
        latency = (time.time() - start) * 1000
        components["redis"] = ComponentHealth(
            status=HealthStatus.HEALTHY,
            latency_ms=round(latency, 2),
        )
    except Exception as e:
        logger.error("Redis health check failed", error=str(e))
        components["redis"] = ComponentHealth(
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )
        overall_status = HealthStatus.DEGRADED
    
    # Check MongoDB
    try:
        mongo = await get_mongodb_client()
        start = time.time()
        await mongo.admin.command("ping")
        latency = (time.time() - start) * 1000
        components["mongodb"] = ComponentHealth(
            status=HealthStatus.HEALTHY,
            latency_ms=round(latency, 2),
        )
    except Exception as e:
        logger.error("MongoDB health check failed", error=str(e))
        components["mongodb"] = ComponentHealth(
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )
        overall_status = HealthStatus.DEGRADED
    
    # Check if all components are unhealthy
    unhealthy_count = sum(
        1 for c in components.values() if c.status == HealthStatus.UNHEALTHY
    )
    if unhealthy_count == len(components):
        overall_status = HealthStatus.UNHEALTHY
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        components=components,
    )


@router.get("/health/live")
async def liveness_probe() -> dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if the service is running.
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_probe() -> dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    Returns 200 if the service is ready to accept traffic.
    """
    # Check if we can connect to required services
    try:
        redis = await get_redis_client()
        await redis.ping()
        
        mongo = await get_mongodb_client()
        await mongo.admin.command("ping")
        
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Service not ready")

"""
Redis client service
"""
from functools import lru_cache

import redis.asyncio as redis

from app.config import get_settings

settings = get_settings()

_redis_client: redis.Redis | None = None


def _create_redis_client() -> redis.Redis:
    """Create Redis client instance (internal use)."""
    return redis.Redis.from_url(
        str(settings.redis_url),
        decode_responses=True,
    )


async def get_redis_client() -> redis.Redis:
    """Get Redis client instance with connection validation."""
    global _redis_client
    if _redis_client is None:
        _redis_client = _create_redis_client()
    # Validate connection is alive
    await _redis_client.ping()
    return _redis_client

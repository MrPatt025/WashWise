"""
Redis client service
"""
import redis.asyncio as redis
from functools import lru_cache

from app.config import get_settings

settings = get_settings()


@lru_cache
def get_redis_pool() -> redis.ConnectionPool:
    """Get Redis connection pool."""
    return redis.ConnectionPool.from_url(
        str(settings.redis_url),
        decode_responses=True,
    )


async def get_redis_client() -> redis.Redis:
    """Get Redis client instance."""
    pool = get_redis_pool()
    return redis.Redis(connection_pool=pool)

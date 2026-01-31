"""
MongoDB client service
"""
from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

settings = get_settings()

_client: AsyncIOMotorClient | None = None


async def get_mongodb_client() -> AsyncIOMotorClient:
    """Get MongoDB client instance."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(str(settings.mongodb_url))
    return _client


async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    client = await get_mongodb_client()
    return client[settings.mongodb_database]


async def get_conversations_collection():
    """Get conversations collection."""
    db = await get_database()
    return db.conversations


async def get_ai_insights_collection():
    """Get AI insights collection."""
    db = await get_database()
    return db.ai_insights

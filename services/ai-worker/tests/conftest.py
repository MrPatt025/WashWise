"""
Pytest configuration and fixtures for AI Worker tests.
"""
import pytest
import asyncio
from typing import Generator


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singleton instances between tests."""
    import app.services.chat_service as chat_module
    import app.services.redis_client as redis_module
    import app.services.mongodb_client as mongo_module
    
    # Reset singletons
    chat_module._chat_service = None
    redis_module._redis_client = None
    mongo_module._mongodb_client = None
    
    yield
    
    # Cleanup after test
    chat_module._chat_service = None
    redis_module._redis_client = None
    mongo_module._mongodb_client = None

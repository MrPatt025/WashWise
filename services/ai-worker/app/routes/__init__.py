"""
Routes package for AI Worker
"""
from app.routes.chat import router as chat_router
from app.routes.health import router as health_router
from app.routes.intents import router as intents_router

__all__ = ["chat_router", "health_router", "intents_router"]

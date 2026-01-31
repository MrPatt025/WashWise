"""
WashWise AI Worker Service Configuration
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, MongoDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "washwise-ai-worker"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8081

    # Core API
    core_api_url: str = Field(default="http://localhost:8080/api")
    core_api_timeout: int = 30

    # Redis
    redis_url: RedisDsn = Field(default="redis://localhost:6379/0")

    # MongoDB
    mongodb_url: MongoDsn = Field(default="mongodb://localhost:27017")
    mongodb_database: str = "washwise"

    # OpenAI
    openai_api_key: str = Field(default="")
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Observability
    otel_exporter_endpoint: str = "http://localhost:4317"
    tracing_sample_rate: float = 1.0

    # AI Configuration
    ai_max_tokens: int = 4096
    ai_temperature: float = 0.7
    ai_context_window: int = 10  # Number of messages to include in context


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

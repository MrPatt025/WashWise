"""
Chat-related Pydantic models
"""
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Message role in conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class IntentType(str, Enum):
    """Detected intent types."""
    GREETING = "greeting"
    MACHINE_STATUS = "machine_status"
    BOOKING_CREATE = "booking_create"
    BOOKING_CANCEL = "booking_cancel"
    BOOKING_STATUS = "booking_status"
    PAYMENT_INQUIRY = "payment_inquiry"
    GENERAL_QUESTION = "general_question"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    UNKNOWN = "unknown"


class ChatMessage(BaseModel):
    """A single chat message."""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    """Incoming chat request."""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: UUID | None = None
    tenant_id: UUID
    user_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class DetectedIntent(BaseModel):
    """Result of intent detection."""
    intent: IntentType
    confidence: float = Field(ge=0.0, le=1.0)
    entities: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Chat response with AI-generated content."""
    conversation_id: UUID
    message: str
    intent: DetectedIntent
    actions: list[dict[str, Any]] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    tokens_used: int = 0
    processing_time_ms: int = 0


class Conversation(BaseModel):
    """Full conversation record."""
    id: UUID
    tenant_id: UUID
    user_id: UUID
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)

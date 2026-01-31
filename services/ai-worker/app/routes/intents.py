"""
Intent detection routes
"""
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.models.chat import DetectedIntent, IntentType
from app.services.chat_service import get_chat_service

logger = structlog.get_logger()
router = APIRouter(prefix="/intents", tags=["Intents"])


class IntentRequest(BaseModel):
    """Request for intent detection."""
    message: str = Field(..., min_length=1, max_length=2000)


class BatchIntentRequest(BaseModel):
    """Request for batch intent detection."""
    messages: list[str] = Field(..., min_items=1, max_items=50)


class BatchIntentResponse(BaseModel):
    """Response for batch intent detection."""
    results: list[DetectedIntent]
    processing_time_ms: int


class IntentStatsResponse(BaseModel):
    """Response for intent statistics."""
    total_messages: int
    intent_distribution: dict[str, int]
    average_confidence: float
    period_start: str
    period_end: str


def get_tenant_id(x_tenant_id: Annotated[str, Header()]) -> UUID:
    """Extract tenant ID from header."""
    try:
        return UUID(x_tenant_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant ID format",
        )


@router.post("/detect", response_model=DetectedIntent)
async def detect_intent(
    request: IntentRequest,
    tenant_id: UUID = Header(alias="x-tenant-id"),
) -> DetectedIntent:
    """
    Detect the intent of a single message.
    
    This is a lightweight endpoint that only performs intent detection
    without generating a full response or storing conversation history.
    
    Args:
        request: Request containing the message to analyze
        tenant_id: Tenant ID from header
        
    Returns:
        DetectedIntent: Detected intent with confidence score
    """
    logger.info(
        "Detecting intent",
        tenant_id=str(tenant_id),
        message_length=len(request.message),
    )
    
    chat_service = get_chat_service()
    intent = await chat_service._detect_intent(request.message)
    
    return intent


@router.post("/detect/batch", response_model=BatchIntentResponse)
async def detect_intents_batch(
    request: BatchIntentRequest,
    tenant_id: UUID = Header(alias="x-tenant-id"),
) -> BatchIntentResponse:
    """
    Detect intents for multiple messages in batch.
    
    This is useful for analyzing historical data or preprocessing
    incoming messages for routing decisions.
    
    Args:
        request: Request containing messages to analyze
        tenant_id: Tenant ID from header
        
    Returns:
        BatchIntentResponse: List of detected intents
    """
    import asyncio
    import time
    
    logger.info(
        "Batch detecting intents",
        tenant_id=str(tenant_id),
        message_count=len(request.messages),
    )
    
    start_time = time.time()
    
    chat_service = get_chat_service()
    
    # Process all messages concurrently
    tasks = [chat_service._detect_intent(msg) for msg in request.messages]
    results = await asyncio.gather(*tasks)
    
    processing_time_ms = int((time.time() - start_time) * 1000)
    
    return BatchIntentResponse(
        results=list(results),
        processing_time_ms=processing_time_ms,
    )


@router.get("/types")
async def list_intent_types() -> dict:
    """
    List all supported intent types.
    
    Returns:
        dict: List of intent types with descriptions
    """
    intent_descriptions = {
        IntentType.GREETING: "Simple hello or greeting",
        IntentType.MACHINE_STATUS: "Asking about machine availability or status",
        IntentType.BOOKING_CREATE: "Wants to make a reservation",
        IntentType.BOOKING_CANCEL: "Wants to cancel a booking",
        IntentType.BOOKING_STATUS: "Asking about existing booking",
        IntentType.PAYMENT_INQUIRY: "Questions about payment or pricing",
        IntentType.GENERAL_QUESTION: "General questions about services",
        IntentType.COMPLAINT: "Expressing dissatisfaction",
        IntentType.FEEDBACK: "Providing feedback",
        IntentType.UNKNOWN: "Cannot determine intent",
    }
    
    return {
        "intent_types": [
            {"type": intent.value, "description": desc}
            for intent, desc in intent_descriptions.items()
        ]
    }

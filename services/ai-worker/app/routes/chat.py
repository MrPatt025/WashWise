"""
Chat routes for AI-powered conversations
"""
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from app.models.chat import ChatRequest, ChatResponse, Conversation
from app.services.chat_service import get_chat_service
from app.services.mongodb_client import get_conversations_collection

logger = structlog.get_logger()
router = APIRouter(prefix="/chat", tags=["Chat"])


class ConversationListResponse(BaseModel):
    """Response for listing conversations."""
    conversations: list[dict]
    total: int
    page: int
    page_size: int


def get_tenant_id(x_tenant_id: Annotated[str, Header()]) -> UUID:
    """Extract tenant ID from header."""
    try:
        return UUID(x_tenant_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant ID format",
        )


def get_user_id(x_user_id: Annotated[str, Header()]) -> UUID:
    """Extract user ID from header."""
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    user_id: UUID = Depends(get_user_id),
) -> ChatResponse:
    """
    Send a message and get an AI-powered response.
    
    This endpoint processes the user's message through the AI system,
    detects intent, and generates an appropriate response.
    
    Args:
        request: Chat request with message and context
        tenant_id: Tenant ID from header
        user_id: User ID from header
        
    Returns:
        ChatResponse: AI response with intent and suggestions
    """
    # Validate that request matches headers
    if request.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant ID mismatch",
        )
    
    if request.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch",
        )
    
    logger.info(
        "Received chat message",
        tenant_id=str(tenant_id),
        user_id=str(user_id),
        conversation_id=str(request.conversation_id) if request.conversation_id else None,
    )
    
    chat_service = get_chat_service()
    response = await chat_service.process_message(request)
    
    return response


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    tenant_id: UUID = Depends(get_tenant_id),
    user_id: UUID = Depends(get_user_id),
    page: int = 1,
    page_size: int = 20,
) -> ConversationListResponse:
    """
    List conversations for a user.
    
    Args:
        tenant_id: Tenant ID from header
        user_id: User ID from header
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        ConversationListResponse: List of conversations with pagination
    """
    collection = await get_conversations_collection()
    
    # Calculate skip
    skip = (page - 1) * page_size
    
    # Query conversations
    cursor = collection.find(
        {"tenant_id": str(tenant_id), "user_id": str(user_id)}
    ).sort("updated_at", -1).skip(skip).limit(page_size)
    
    conversations = []
    async for doc in cursor:
        conversations.append({
            "id": doc["_id"],
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"],
            "message_count": len(doc.get("messages", [])),
            "last_message": doc.get("messages", [{}])[-1].get("content", "")[:100] if doc.get("messages") else None,
        })
    
    # Get total count
    total = await collection.count_documents(
        {"tenant_id": str(tenant_id), "user_id": str(user_id)}
    )
    
    return ConversationListResponse(
        conversations=conversations,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    user_id: UUID = Depends(get_user_id),
) -> dict:
    """
    Get a specific conversation with all messages.
    
    Args:
        conversation_id: The conversation ID
        tenant_id: Tenant ID from header
        user_id: User ID from header
        
    Returns:
        dict: Full conversation details with messages
    """
    collection = await get_conversations_collection()
    
    doc = await collection.find_one({
        "_id": str(conversation_id),
        "tenant_id": str(tenant_id),
        "user_id": str(user_id),
    })
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    return {
        "id": doc["_id"],
        "tenant_id": doc["tenant_id"],
        "user_id": doc["user_id"],
        "messages": doc.get("messages", []),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "metadata": doc.get("metadata", {}),
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    user_id: UUID = Depends(get_user_id),
) -> dict:
    """
    Delete a conversation.
    
    Args:
        conversation_id: The conversation ID to delete
        tenant_id: Tenant ID from header
        user_id: User ID from header
        
    Returns:
        dict: Confirmation message
    """
    collection = await get_conversations_collection()
    
    result = await collection.delete_one({
        "_id": str(conversation_id),
        "tenant_id": str(tenant_id),
        "user_id": str(user_id),
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    logger.info(
        "Deleted conversation",
        conversation_id=str(conversation_id),
        tenant_id=str(tenant_id),
    )
    
    return {"message": "Conversation deleted successfully"}

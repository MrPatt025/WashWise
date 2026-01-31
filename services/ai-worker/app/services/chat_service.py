"""
AI Chat Service using LangChain
"""
import time
from datetime import datetime
from uuid import UUID, uuid4

import structlog
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.models.chat import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Conversation,
    DetectedIntent,
    IntentType,
    MessageRole,
)
from app.services.mongodb_client import get_conversations_collection

logger = structlog.get_logger()
settings = get_settings()

# System prompt for the laundromat assistant
SYSTEM_PROMPT = """You are a helpful AI assistant for WashWise, a smart laundromat management platform.
You help customers with:
- Checking machine availability and status
- Making and managing bookings
- Answering questions about services and pricing
- Handling complaints and feedback

Guidelines:
- Be friendly, professional, and concise
- If you don't know something, say so and offer to connect with staff
- For booking actions, confirm details before proceeding
- Provide helpful suggestions when appropriate
- Respond in the same language as the user (Thai or English)

Current context:
- Tenant: {tenant_name}
- User: {user_name}
"""

INTENT_DETECTION_PROMPT = """Analyze the following message and determine the user's intent.

Message: {message}

Possible intents:
- greeting: Simple hello or greeting
- machine_status: Asking about machine availability or status
- booking_create: Wants to make a reservation
- booking_cancel: Wants to cancel a booking
- booking_status: Asking about existing booking
- payment_inquiry: Questions about payment or pricing
- general_question: General questions about services
- complaint: Expressing dissatisfaction
- feedback: Providing feedback
- unknown: Cannot determine intent

Respond with JSON:
{{"intent": "intent_name", "confidence": 0.0-1.0, "entities": {{}}}}

Extract any relevant entities like machine_type, date, time, booking_id if mentioned.
"""


class ChatService:
    """AI-powered chat service for customer interactions."""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=settings.ai_temperature,
            max_tokens=settings.ai_max_tokens,
        )
        self.intent_llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model="gpt-4o-mini",  # Faster model for intent detection
            temperature=0.1,
        )

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """Process an incoming chat message and generate a response."""
        start_time = time.time()
        
        logger.info(
            "Processing chat message",
            tenant_id=str(request.tenant_id),
            user_id=str(request.user_id),
            message_length=len(request.message),
        )

        # Get or create conversation
        conversation = await self._get_or_create_conversation(request)

        # Detect intent
        intent = await self._detect_intent(request.message)
        
        # Build message history for context
        messages = self._build_messages(conversation, request)

        # Generate response
        response = await self.llm.ainvoke(messages)
        
        # Extract response content
        response_text = response.content if isinstance(response.content, str) else str(response.content)
        
        # Calculate tokens (approximate)
        tokens_used = response.usage_metadata.get("total_tokens", 0) if response.usage_metadata else 0

        # Save messages to conversation
        await self._save_messages(
            conversation,
            request.message,
            response_text,
            intent,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        # Generate suggestions based on intent
        suggestions = self._generate_suggestions(intent)

        logger.info(
            "Chat response generated",
            conversation_id=str(conversation.id),
            intent=intent.intent.value,
            tokens_used=tokens_used,
            processing_time_ms=processing_time_ms,
        )

        return ChatResponse(
            conversation_id=conversation.id,
            message=response_text,
            intent=intent,
            actions=[],
            suggestions=suggestions,
            tokens_used=tokens_used,
            processing_time_ms=processing_time_ms,
        )

    async def _detect_intent(self, message: str) -> DetectedIntent:
        """Detect the intent of a message."""
        try:
            prompt = INTENT_DETECTION_PROMPT.format(message=message)
            response = await self.intent_llm.ainvoke([HumanMessage(content=prompt)])
            
            # Parse JSON response
            import json
            content = response.content if isinstance(response.content, str) else str(response.content)
            
            # Extract JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            
            return DetectedIntent(
                intent=IntentType(data.get("intent", "unknown")),
                confidence=float(data.get("confidence", 0.5)),
                entities=data.get("entities", {}),
            )
        except Exception as e:
            logger.warning("Intent detection failed", error=str(e))
            return DetectedIntent(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                entities={},
            )

    async def _get_or_create_conversation(self, request: ChatRequest) -> Conversation:
        """Get existing conversation or create a new one."""
        collection = await get_conversations_collection()
        
        if request.conversation_id:
            doc = await collection.find_one({
                "_id": str(request.conversation_id),
                "tenant_id": str(request.tenant_id),
            })
            if doc:
                return Conversation(
                    id=UUID(doc["_id"]),
                    tenant_id=UUID(doc["tenant_id"]),
                    user_id=UUID(doc["user_id"]),
                    messages=[ChatMessage(**m) for m in doc.get("messages", [])],
                    created_at=doc["created_at"],
                    updated_at=doc["updated_at"],
                    metadata=doc.get("metadata", {}),
                )

        # Create new conversation
        conversation_id = uuid4()
        conversation = Conversation(
            id=conversation_id,
            tenant_id=request.tenant_id,
            user_id=request.user_id,
            messages=[],
            metadata=request.context,
        )
        
        await collection.insert_one({
            "_id": str(conversation_id),
            "tenant_id": str(request.tenant_id),
            "user_id": str(request.user_id),
            "messages": [],
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "metadata": request.context,
        })
        
        return conversation

    def _build_messages(self, conversation: Conversation, request: ChatRequest):
        """Build message list for LLM context."""
        messages = []
        
        # System message
        tenant_name = request.context.get("tenant_name", "WashWise")
        user_name = request.context.get("user_name", "Customer")
        
        system_content = SYSTEM_PROMPT.format(
            tenant_name=tenant_name,
            user_name=user_name,
        )
        messages.append(SystemMessage(content=system_content))
        
        # Recent conversation history
        recent_messages = conversation.messages[-settings.ai_context_window:]
        for msg in recent_messages:
            if msg.role == MessageRole.USER:
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == MessageRole.ASSISTANT:
                messages.append(AIMessage(content=msg.content))
        
        # Current message
        messages.append(HumanMessage(content=request.message))
        
        return messages

    async def _save_messages(
        self,
        conversation: Conversation,
        user_message: str,
        assistant_message: str,
        intent: DetectedIntent,
    ):
        """Save messages to conversation history."""
        collection = await get_conversations_collection()
        
        now = datetime.utcnow()
        
        new_messages = [
            {
                "role": MessageRole.USER.value,
                "content": user_message,
                "timestamp": now,
                "metadata": {"intent": intent.intent.value},
            },
            {
                "role": MessageRole.ASSISTANT.value,
                "content": assistant_message,
                "timestamp": now,
                "metadata": {},
            },
        ]
        
        await collection.update_one(
            {"_id": str(conversation.id)},
            {
                "$push": {"messages": {"$each": new_messages}},
                "$set": {"updated_at": now},
            },
        )

    def _generate_suggestions(self, intent: DetectedIntent) -> list[str]:
        """Generate follow-up suggestions based on intent."""
        suggestions_map = {
            IntentType.GREETING: [
                "Check machine availability",
                "Make a booking",
                "View my bookings",
            ],
            IntentType.MACHINE_STATUS: [
                "Book this machine",
                "Show all available machines",
                "Notify when available",
            ],
            IntentType.BOOKING_CREATE: [
                "View available times",
                "Check machine types",
                "View pricing",
            ],
            IntentType.BOOKING_STATUS: [
                "Cancel booking",
                "Modify booking",
                "Get directions",
            ],
            IntentType.PAYMENT_INQUIRY: [
                "View payment methods",
                "Check booking history",
                "Contact support",
            ],
        }
        
        return suggestions_map.get(intent.intent, ["Ask another question", "Contact support"])


# Singleton instance
_chat_service: ChatService | None = None


def get_chat_service() -> ChatService:
    """Get chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service

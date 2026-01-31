"""
Integration tests for AI Worker Chat API
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from unittest.mock import patch, AsyncMock, MagicMock

from app.main import create_app


@pytest.fixture
def app():
    """Create test application."""
    return create_app()


@pytest.fixture
async def client(app):
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Create authentication headers."""
    return {
        "x-tenant-id": str(uuid4()),
        "x-user-id": str(uuid4()),
    }


class TestChatMessageEndpoint:
    """Tests for POST /api/v1/chat/message endpoint."""

    @pytest.mark.asyncio
    async def test_send_message_success(self, client, auth_headers):
        """Test sending a message returns AI response."""
        with patch('app.services.chat_service.ChatOpenAI') as mock_llm_class:
            # Mock LLM
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "Hello! How can I help you today?"
            mock_response.usage_metadata = {"total_tokens": 50}
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            mock_llm_class.return_value = mock_llm
            
            # Mock intent detection
            mock_intent_response = MagicMock()
            mock_intent_response.content = '{"intent": "greeting", "confidence": 0.95, "entities": {}}'
            
            with patch('app.services.mongodb_client.get_conversations_collection') as mock_coll:
                mock_collection = AsyncMock()
                mock_collection.find_one = AsyncMock(return_value=None)
                mock_collection.insert_one = AsyncMock()
                mock_collection.update_one = AsyncMock()
                mock_coll.return_value = mock_collection

                # Given
                request = {
                    "tenant_id": auth_headers["x-tenant-id"],
                    "user_id": auth_headers["x-user-id"],
                    "message": "Hello, what services do you offer?",
                    "context": {"tenant_name": "Test Laundry"},
                }

                # When
                response = await client.post(
                    "/api/v1/chat/message",
                    json=request,
                    headers=auth_headers,
                )

                # Then
                assert response.status_code == 200
                data = response.json()
                assert "conversation_id" in data
                assert "message" in data
                assert "intent" in data
                assert data["processing_time_ms"] >= 0

    @pytest.mark.asyncio
    async def test_send_message_tenant_mismatch_returns_403(self, client, auth_headers):
        """Test tenant ID mismatch in request vs header returns forbidden."""
        # Given - different tenant ID in body vs header
        request = {
            "tenant_id": str(uuid4()),  # Different from header
            "user_id": auth_headers["x-user-id"],
            "message": "Hello",
            "context": {},
        }

        # When
        response = await client.post(
            "/api/v1/chat/message",
            json=request,
            headers=auth_headers,
        )

        # Then
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_send_message_user_mismatch_returns_403(self, client, auth_headers):
        """Test user ID mismatch in request vs header returns forbidden."""
        # Given - different user ID in body vs header
        request = {
            "tenant_id": auth_headers["x-tenant-id"],
            "user_id": str(uuid4()),  # Different from header
            "message": "Hello",
            "context": {},
        }

        # When
        response = await client.post(
            "/api/v1/chat/message",
            json=request,
            headers=auth_headers,
        )

        # Then
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_send_message_missing_tenant_header_returns_422(self, client):
        """Test missing tenant header returns validation error."""
        # Given - no x-tenant-id header
        request = {
            "tenant_id": str(uuid4()),
            "user_id": str(uuid4()),
            "message": "Hello",
            "context": {},
        }

        # When
        response = await client.post(
            "/api/v1/chat/message",
            json=request,
            headers={"x-user-id": str(uuid4())},
        )

        # Then
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_send_message_invalid_tenant_id_format(self, client):
        """Test invalid UUID format returns 400."""
        # Given
        request = {
            "tenant_id": "not-a-uuid",
            "user_id": str(uuid4()),
            "message": "Hello",
            "context": {},
        }

        # When
        response = await client.post(
            "/api/v1/chat/message",
            json=request,
            headers={
                "x-tenant-id": "not-a-uuid",
                "x-user-id": str(uuid4()),
            },
        )

        # Then
        assert response.status_code == 400


class TestConversationsEndpoint:
    """Tests for conversation management endpoints."""

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self, client, auth_headers):
        """Test listing conversations when none exist."""
        with patch('app.services.mongodb_client.get_conversations_collection') as mock_coll:
            mock_collection = AsyncMock()
            
            # Mock cursor for find
            mock_cursor = AsyncMock()
            mock_cursor.__aiter__ = lambda self: self
            mock_cursor.__anext__ = AsyncMock(side_effect=StopAsyncIteration)
            
            mock_collection.find.return_value = mock_cursor
            mock_collection.count_documents = AsyncMock(return_value=0)
            mock_coll.return_value = mock_collection

            # When
            response = await client.get(
                "/api/v1/chat/conversations",
                headers=auth_headers,
            )

            # Then
            assert response.status_code == 200
            data = response.json()
            assert data["conversations"] == []
            assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_get_conversation_not_found(self, client, auth_headers):
        """Test getting non-existent conversation returns 404."""
        with patch('app.services.mongodb_client.get_conversations_collection') as mock_coll:
            mock_collection = AsyncMock()
            mock_collection.find_one = AsyncMock(return_value=None)
            mock_coll.return_value = mock_collection

            conversation_id = uuid4()

            # When
            response = await client.get(
                f"/api/v1/chat/conversations/{conversation_id}",
                headers=auth_headers,
            )

            # Then
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_conversation_not_found(self, client, auth_headers):
        """Test deleting non-existent conversation returns 404."""
        with patch('app.services.mongodb_client.get_conversations_collection') as mock_coll:
            mock_collection = AsyncMock()
            mock_result = MagicMock()
            mock_result.deleted_count = 0
            mock_collection.delete_one = AsyncMock(return_value=mock_result)
            mock_coll.return_value = mock_collection

            conversation_id = uuid4()

            # When
            response = await client.delete(
                f"/api/v1/chat/conversations/{conversation_id}",
                headers=auth_headers,
            )

            # Then
            assert response.status_code == 404


class TestIntentDetectionEndpoint:
    """Tests for intent detection endpoints."""

    @pytest.mark.asyncio
    async def test_detect_intent_success(self, client, auth_headers):
        """Test single intent detection returns valid result."""
        with patch('app.services.chat_service.ChatOpenAI') as mock_llm_class:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = '{"intent": "booking_create", "confidence": 0.92, "entities": {"machine_type": "washer"}}'
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            mock_llm_class.return_value = mock_llm

            # Given
            request = {"message": "I want to book a washing machine"}

            # When
            response = await client.post(
                "/api/v1/intents/detect",
                json=request,
                headers=auth_headers,
            )

            # Then
            assert response.status_code == 200
            data = response.json()
            assert "intent" in data
            assert "confidence" in data
            assert 0 <= data["confidence"] <= 1

    @pytest.mark.asyncio
    async def test_detect_intent_batch(self, client, auth_headers):
        """Test batch intent detection processes all messages."""
        with patch('app.services.chat_service.ChatOpenAI') as mock_llm_class:
            mock_llm = MagicMock()
            mock_response = MagicMock()
            mock_response.content = '{"intent": "general_question", "confidence": 0.8, "entities": {}}'
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            mock_llm_class.return_value = mock_llm

            # Given
            request = {
                "messages": [
                    "Hello",
                    "What machines are available?",
                    "I want to make a complaint",
                ]
            }

            # When
            response = await client.post(
                "/api/v1/intents/detect/batch",
                json=request,
                headers=auth_headers,
            )

            # Then
            assert response.status_code == 200
            data = response.json()
            assert len(data["results"]) == 3
            assert data["processing_time_ms"] >= 0

    @pytest.mark.asyncio
    async def test_list_intent_types(self, client):
        """Test listing available intent types."""
        # When
        response = await client.get("/api/v1/intents/types")

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "intent_types" in data
        assert len(data["intent_types"]) >= 5

        # Verify expected intents exist
        intent_names = [it["type"] for it in data["intent_types"]]
        assert "greeting" in intent_names
        assert "booking_create" in intent_names
        assert "machine_status" in intent_names


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test main health check endpoint."""
        with patch('app.services.redis_client.get_redis_client') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis_client.ping = AsyncMock()
            mock_redis.return_value = mock_redis_client

            with patch('app.services.mongodb_client.get_mongodb_client') as mock_mongo:
                mock_mongo_client = AsyncMock()
                mock_mongo_client.admin.command = AsyncMock()
                mock_mongo.return_value = mock_mongo_client

                # When
                response = await client.get("/health")

                # Then
                assert response.status_code == 200
                data = response.json()
                assert data["status"] in ["healthy", "degraded", "unhealthy"]
                assert "components" in data
                assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe."""
        # When
        response = await client.get("/health/live")

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @pytest.mark.asyncio
    async def test_readiness_probe_healthy(self, client):
        """Test Kubernetes readiness probe when services are healthy."""
        with patch('app.services.redis_client.get_redis_client') as mock_redis:
            mock_redis_client = AsyncMock()
            mock_redis_client.ping = AsyncMock()
            mock_redis.return_value = mock_redis_client

            with patch('app.services.mongodb_client.get_mongodb_client') as mock_mongo:
                mock_mongo_client = AsyncMock()
                mock_mongo_client.admin.command = AsyncMock()
                mock_mongo.return_value = mock_mongo_client

                # When
                response = await client.get("/health/ready")

                # Then
                assert response.status_code == 200
                assert response.json()["status"] == "ready"

    @pytest.mark.asyncio
    async def test_readiness_probe_unhealthy(self, client):
        """Test Kubernetes readiness probe when Redis is down."""
        with patch('app.services.redis_client.get_redis_client') as mock_redis:
            mock_redis.side_effect = Exception("Connection refused")

            # When
            response = await client.get("/health/ready")

            # Then
            assert response.status_code == 503

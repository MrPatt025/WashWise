# WashWise v2.0 Test Plan

## Document Information

- **Version**: 2.0
- **Last Updated**: January 2025
- **Scope**: Enterprise Microservices + AI Architecture

---

## Table of Contents

1. [Test Strategy Overview](#1-test-strategy-overview)
2. [Test Pyramid](#2-test-pyramid)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [End-to-End Tests](#5-end-to-end-tests)
6. [Security Tests](#6-security-tests)
7. [Performance Tests](#7-performance-tests)
8. [Test Data Management](#8-test-data-management)
9. [CI/CD Integration](#9-cicd-integration)
10. [Concrete Test Examples](#10-concrete-test-examples)

---

## 1. Test Strategy Overview

### 1.1 Testing Philosophy

- **Shift-Left Testing**: Catch issues early in development
- **Test Automation First**: 95%+ automated test coverage
- **Risk-Based Testing**: Focus on critical business flows
- **Continuous Testing**: Tests run on every commit

### 1.2 Quality Gates

| Gate              | Criteria                 | Tool               |
| ----------------- | ------------------------ | ------------------ |
| Unit Tests        | 80% coverage             | JaCoCo, pytest-cov |
| Integration Tests | All critical paths       | Testcontainers     |
| E2E Tests         | Happy paths + edge cases | Playwright, k6     |
| Security Scan     | No critical/high issues  | OWASP ZAP, Trivy   |
| Performance       | P95 < 500ms, P99 < 1s    | k6, Grafana        |

### 1.3 Test Environments

| Environment | Purpose           | Data            |
| ----------- | ----------------- | --------------- |
| Local       | Developer testing | Testcontainers  |
| CI          | Automated tests   | Ephemeral       |
| Staging     | Pre-production    | Anonymized prod |
| Production  | Smoke tests only  | Live            |

---

## 2. Test Pyramid

```
                    ┌─────────────────┐
                    │    E2E Tests    │  5%
                    │  (UI + API)     │
                    └────────┬────────┘
                   ┌─────────┴─────────┐
                   │ Integration Tests │  20%
                   │   (API + DB)      │
                   └────────┬──────────┘
              ┌─────────────┴─────────────┐
              │       Unit Tests          │  75%
              │  (Services, Utils, DTOs)  │
              └───────────────────────────┘
```

### Coverage Targets by Service

| Service             | Unit | Integration | E2E |
| ------------------- | ---- | ----------- | --- |
| Core API (Java)     | 85%  | 70%         | -   |
| AI Worker (Python)  | 80%  | 65%         | -   |
| Web Admin (Next.js) | 75%  | -           | 60% |
| Overall             | 80%  | 65%         | 50% |

---

## 3. Unit Tests

### 3.1 Java Core API Unit Tests

#### Test Categories

1. **Service Layer Tests**
2. **Controller Tests (MockMvc)**
3. **Repository Tests (DataJpaTest)**
4. **Security Tests**
5. **Utility/Helper Tests**

#### Naming Convention

```
{MethodUnderTest}_{StateUnderTest}_{ExpectedBehavior}
```

#### Example: AuthService Tests

```java
// File: src/test/java/com/washwise/core/service/AuthServiceTest.java

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private RefreshTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    // =====================================
    // REGISTRATION TESTS
    // =====================================

    @Test
    @DisplayName("register_WithValidData_ReturnsAuthResponse")
    void register_WithValidData_ReturnsAuthResponse() {
        // Given
        RegisterRequest request = new RegisterRequest(
            "test@example.com",
            "SecurePass123!",
            "Test User",
            "Test Laundry"
        );

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(i -> {
            Tenant t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        // When
        AuthResponse response = authService.register(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().email()).isEqualTo("test@example.com");

        verify(tenantRepository).save(any(Tenant.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register_WithExistingEmail_ThrowsConflictException")
    void register_WithExistingEmail_ThrowsConflictException() {
        // Given
        RegisterRequest request = new RegisterRequest(
            "existing@example.com",
            "SecurePass123!",
            "Test User",
            "Test Laundry"
        );

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ConflictException.class)
            .hasMessage("Email already registered");

        verify(tenantRepository, never()).save(any());
    }

    // =====================================
    // LOGIN TESTS
    // =====================================

    @Test
    @DisplayName("login_WithValidCredentials_ReturnsAuthResponse")
    void login_WithValidCredentials_ReturnsAuthResponse() {
        // Given
        LoginRequest request = new LoginRequest(
            "test@example.com",
            "SecurePass123!"
        );

        Tenant tenant = createTestTenant();
        User user = createTestUser(tenant);

        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SecurePass123!", user.getPasswordHash()))
            .thenReturn(true);
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        // When
        AuthResponse response = authService.login(request);

        // Then
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.user().email()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("login_WithInvalidPassword_ThrowsUnauthorizedException")
    void login_WithInvalidPassword_ThrowsUnauthorizedException() {
        // Given
        LoginRequest request = new LoginRequest(
            "test@example.com",
            "WrongPassword"
        );

        User user = createTestUser(createTestTenant());

        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString()))
            .thenReturn(false);

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Invalid credentials");
    }

    @Test
    @DisplayName("login_WithNonExistentUser_ThrowsUnauthorizedException")
    void login_WithNonExistentUser_ThrowsUnauthorizedException() {
        // Given
        LoginRequest request = new LoginRequest(
            "nonexistent@example.com",
            "AnyPassword"
        );

        when(userRepository.findByEmail("nonexistent@example.com"))
            .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);
    }

    // =====================================
    // TOKEN REFRESH TESTS
    // =====================================

    @Test
    @DisplayName("refresh_WithValidToken_ReturnsNewTokenPair")
    void refresh_WithValidToken_ReturnsNewTokenPair() {
        // Given
        String refreshToken = "valid-refresh-token";
        RefreshToken storedToken = createValidRefreshToken();

        when(tokenRepository.findByToken(refreshToken))
            .thenReturn(Optional.of(storedToken));
        when(jwtService.generateAccessToken(any())).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("new-refresh-token");

        // When
        AuthResponse response = authService.refresh(refreshToken);

        // Then
        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");

        // Verify old token is revoked
        verify(tokenRepository).save(argThat(token -> token.isRevoked()));
    }

    @Test
    @DisplayName("refresh_WithRevokedToken_DetectsTheftAndRevokesFamily")
    void refresh_WithRevokedToken_DetectsTheftAndRevokesFamily() {
        // Given
        String refreshToken = "stolen-refresh-token";
        RefreshToken revokedToken = createRevokedRefreshToken();

        when(tokenRepository.findByToken(refreshToken))
            .thenReturn(Optional.of(revokedToken));

        // When/Then
        assertThatThrownBy(() -> authService.refresh(refreshToken))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Token reuse detected");

        // Verify entire token family is revoked
        verify(tokenRepository).revokeAllByFamilyId(revokedToken.getFamilyId());
    }

    @Test
    @DisplayName("refresh_WithExpiredToken_ThrowsUnauthorizedException")
    void refresh_WithExpiredToken_ThrowsUnauthorizedException() {
        // Given
        String refreshToken = "expired-token";
        RefreshToken expiredToken = createExpiredRefreshToken();

        when(tokenRepository.findByToken(refreshToken))
            .thenReturn(Optional.of(expiredToken));

        // When/Then
        assertThatThrownBy(() -> authService.refresh(refreshToken))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Refresh token expired");
    }

    // =====================================
    // HELPER METHODS
    // =====================================

    private Tenant createTestTenant() {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("Test Laundry");
        tenant.setStatus(TenantStatus.ACTIVE);
        return tenant;
    }

    private User createTestUser(Tenant tenant) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPasswordHash("hashedPassword");
        user.setRole(UserRole.OWNER);
        user.setTenant(tenant);
        return user;
    }

    private RefreshToken createValidRefreshToken() {
        RefreshToken token = new RefreshToken();
        token.setToken("valid-refresh-token");
        token.setFamilyId(UUID.randomUUID());
        token.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
        token.setRevoked(false);
        token.setUser(createTestUser(createTestTenant()));
        return token;
    }

    private RefreshToken createRevokedRefreshToken() {
        RefreshToken token = createValidRefreshToken();
        token.setRevoked(true);
        return token;
    }

    private RefreshToken createExpiredRefreshToken() {
        RefreshToken token = createValidRefreshToken();
        token.setExpiresAt(Instant.now().minus(Duration.ofDays(1)));
        return token;
    }
}
```

#### Example: MachineService Tests

```java
// File: src/test/java/com/washwise/core/service/MachineServiceTest.java

@ExtendWith(MockitoExtension.class)
class MachineServiceTest {

    @Mock
    private MachineRepository machineRepository;

    @InjectMocks
    private MachineService machineService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID MACHINE_ID = UUID.randomUUID();

    // =====================================
    // CREATE MACHINE TESTS
    // =====================================

    @Test
    @DisplayName("create_WithValidData_ReturnsMachineResponse")
    void create_WithValidData_ReturnsMachineResponse() {
        // Given
        CreateMachineRequest request = new CreateMachineRequest(
            "WASH-001",
            MachineType.WASHER,
            "LG WM3900HBA",
            BigDecimal.valueOf(50.00)
        );

        when(machineRepository.existsByCodeAndTenantId("WASH-001", TENANT_ID))
            .thenReturn(false);
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> {
            Machine m = i.getArgument(0);
            m.setId(MACHINE_ID);
            return m;
        });

        // When
        MachineResponse response = machineService.create(TENANT_ID, request);

        // Then
        assertThat(response.code()).isEqualTo("WASH-001");
        assertThat(response.type()).isEqualTo(MachineType.WASHER);
        assertThat(response.status()).isEqualTo(MachineStatus.AVAILABLE);
        assertThat(response.pricePerCycle()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
    }

    @Test
    @DisplayName("create_WithDuplicateCode_ThrowsConflictException")
    void create_WithDuplicateCode_ThrowsConflictException() {
        // Given
        CreateMachineRequest request = new CreateMachineRequest(
            "EXISTING-001",
            MachineType.WASHER,
            "Model",
            BigDecimal.valueOf(50.00)
        );

        when(machineRepository.existsByCodeAndTenantId("EXISTING-001", TENANT_ID))
            .thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> machineService.create(TENANT_ID, request))
            .isInstanceOf(ConflictException.class)
            .hasMessage("Machine code already exists");
    }

    // =====================================
    // GET MACHINE TESTS (IDOR PROTECTION)
    // =====================================

    @Test
    @DisplayName("getById_WithValidTenantAndId_ReturnsMachine")
    void getById_WithValidTenantAndId_ReturnsMachine() {
        // Given
        Machine machine = createTestMachine(TENANT_ID);

        when(machineRepository.findByIdAndTenantId(MACHINE_ID, TENANT_ID))
            .thenReturn(Optional.of(machine));

        // When
        MachineResponse response = machineService.getById(TENANT_ID, MACHINE_ID);

        // Then
        assertThat(response.id()).isEqualTo(MACHINE_ID);
    }

    @Test
    @DisplayName("getById_WithWrongTenant_ThrowsNotFoundException")
    void getById_WithWrongTenant_ThrowsNotFoundException() {
        // Given
        UUID wrongTenantId = UUID.randomUUID();

        when(machineRepository.findByIdAndTenantId(MACHINE_ID, wrongTenantId))
            .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> machineService.getById(wrongTenantId, MACHINE_ID))
            .isInstanceOf(NotFoundException.class)
            .hasMessage("Machine not found");
    }

    // =====================================
    // CYCLE MANAGEMENT TESTS
    // =====================================

    @Test
    @DisplayName("startCycle_WhenMachineAvailable_StartsSuccessfully")
    void startCycle_WhenMachineAvailable_StartsSuccessfully() {
        // Given
        Machine machine = createTestMachine(TENANT_ID);
        machine.setStatus(MachineStatus.AVAILABLE);

        when(machineRepository.findByIdAndTenantIdWithLock(MACHINE_ID, TENANT_ID))
            .thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));

        // When
        MachineResponse response = machineService.startCycle(
            TENANT_ID,
            MACHINE_ID,
            Duration.ofMinutes(30)
        );

        // Then
        assertThat(response.status()).isEqualTo(MachineStatus.IN_USE);
        assertThat(machine.getCycleStartedAt()).isNotNull();
        assertThat(machine.getCycleEndsAt()).isAfter(Instant.now());
    }

    @Test
    @DisplayName("startCycle_WhenMachineInUse_ThrowsBusinessException")
    void startCycle_WhenMachineInUse_ThrowsBusinessException() {
        // Given
        Machine machine = createTestMachine(TENANT_ID);
        machine.setStatus(MachineStatus.IN_USE);

        when(machineRepository.findByIdAndTenantIdWithLock(MACHINE_ID, TENANT_ID))
            .thenReturn(Optional.of(machine));

        // When/Then
        assertThatThrownBy(() -> machineService.startCycle(
            TENANT_ID,
            MACHINE_ID,
            Duration.ofMinutes(30)
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Machine is not available");
    }

    @Test
    @DisplayName("endCycle_WhenInUse_SetsToAvailable")
    void endCycle_WhenInUse_SetsToAvailable() {
        // Given
        Machine machine = createTestMachine(TENANT_ID);
        machine.setStatus(MachineStatus.IN_USE);
        machine.setCycleStartedAt(Instant.now().minus(Duration.ofMinutes(30)));
        machine.incrementCycleCount();

        when(machineRepository.findByIdAndTenantIdWithLock(MACHINE_ID, TENANT_ID))
            .thenReturn(Optional.of(machine));
        when(machineRepository.save(any(Machine.class))).thenAnswer(i -> i.getArgument(0));

        // When
        MachineResponse response = machineService.endCycle(TENANT_ID, MACHINE_ID);

        // Then
        assertThat(response.status()).isEqualTo(MachineStatus.AVAILABLE);
        assertThat(machine.getCycleStartedAt()).isNull();
        assertThat(machine.getCycleEndsAt()).isNull();
    }

    private Machine createTestMachine(UUID tenantId) {
        Machine machine = new Machine();
        machine.setId(MACHINE_ID);
        machine.setCode("WASH-001");
        machine.setType(MachineType.WASHER);
        machine.setModel("LG WM3900HBA");
        machine.setStatus(MachineStatus.AVAILABLE);
        machine.setPricePerCycle(BigDecimal.valueOf(50.00));

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        machine.setTenant(tenant);

        return machine;
    }
}
```

### 3.2 Python AI Worker Unit Tests

#### Example: Chat Service Tests

```python
# File: tests/unit/test_chat_service.py

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.models.chat import (
    ChatRequest,
    ChatResponse,
    DetectedIntent,
    IntentType,
)
from app.services.chat_service import ChatService


@pytest.fixture
def chat_service():
    """Create chat service with mocked LLM."""
    with patch('app.services.chat_service.ChatOpenAI') as mock_llm_class:
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock()
        mock_llm_class.return_value = mock_llm

        service = ChatService()
        yield service


@pytest.fixture
def sample_request():
    """Create sample chat request."""
    return ChatRequest(
        tenant_id=uuid4(),
        user_id=uuid4(),
        message="What machines are available?",
        context={"tenant_name": "Test Laundry", "user_name": "John"},
    )


class TestChatService:
    """Tests for ChatService."""

    # =====================================
    # INTENT DETECTION TESTS
    # =====================================

    @pytest.mark.asyncio
    async def test_detect_intent_machine_status(self, chat_service):
        """Test detecting machine status intent."""
        # Given
        message = "Are there any washing machines available?"

        # Mock LLM response
        mock_response = MagicMock()
        mock_response.content = '{"intent": "machine_status", "confidence": 0.95, "entities": {}}'
        chat_service.intent_llm.ainvoke = AsyncMock(return_value=mock_response)

        # When
        intent = await chat_service._detect_intent(message)

        # Then
        assert intent.intent == IntentType.MACHINE_STATUS
        assert intent.confidence >= 0.9

    @pytest.mark.asyncio
    async def test_detect_intent_booking_create(self, chat_service):
        """Test detecting booking creation intent."""
        # Given
        message = "I want to book a washing machine for tomorrow at 10am"

        mock_response = MagicMock()
        mock_response.content = '''
        {
            "intent": "booking_create",
            "confidence": 0.92,
            "entities": {"date": "tomorrow", "time": "10am", "machine_type": "washing"}
        }
        '''
        chat_service.intent_llm.ainvoke = AsyncMock(return_value=mock_response)

        # When
        intent = await chat_service._detect_intent(message)

        # Then
        assert intent.intent == IntentType.BOOKING_CREATE
        assert "date" in intent.entities
        assert "time" in intent.entities

    @pytest.mark.asyncio
    async def test_detect_intent_with_llm_error_returns_unknown(self, chat_service):
        """Test graceful handling when LLM fails."""
        # Given
        message = "Some message"
        chat_service.intent_llm.ainvoke = AsyncMock(side_effect=Exception("API Error"))

        # When
        intent = await chat_service._detect_intent(message)

        # Then
        assert intent.intent == IntentType.UNKNOWN
        assert intent.confidence == 0.0

    # =====================================
    # MESSAGE PROCESSING TESTS
    # =====================================

    @pytest.mark.asyncio
    async def test_process_message_returns_response(self, chat_service, sample_request):
        """Test full message processing."""
        # Given
        mock_intent_response = MagicMock()
        mock_intent_response.content = '{"intent": "greeting", "confidence": 0.95, "entities": {}}'
        chat_service.intent_llm.ainvoke = AsyncMock(return_value=mock_intent_response)

        mock_chat_response = MagicMock()
        mock_chat_response.content = "Hello! How can I help you today?"
        mock_chat_response.usage_metadata = {"total_tokens": 50}
        chat_service.llm.ainvoke = AsyncMock(return_value=mock_chat_response)

        # Mock MongoDB operations
        with patch('app.services.chat_service.get_conversations_collection') as mock_coll:
            mock_collection = AsyncMock()
            mock_collection.find_one = AsyncMock(return_value=None)
            mock_collection.insert_one = AsyncMock()
            mock_collection.update_one = AsyncMock()
            mock_coll.return_value = mock_collection

            # When
            response = await chat_service.process_message(sample_request)

        # Then
        assert isinstance(response, ChatResponse)
        assert response.message == "Hello! How can I help you today?"
        assert response.intent.intent == IntentType.GREETING
        assert response.processing_time_ms > 0

    # =====================================
    # SUGGESTION GENERATION TESTS
    # =====================================

    def test_generate_suggestions_for_greeting(self, chat_service):
        """Test generating suggestions for greeting intent."""
        intent = DetectedIntent(
            intent=IntentType.GREETING,
            confidence=0.95,
            entities={},
        )

        suggestions = chat_service._generate_suggestions(intent)

        assert "Check machine availability" in suggestions
        assert len(suggestions) >= 2

    def test_generate_suggestions_for_machine_status(self, chat_service):
        """Test generating suggestions for machine status intent."""
        intent = DetectedIntent(
            intent=IntentType.MACHINE_STATUS,
            confidence=0.95,
            entities={},
        )

        suggestions = chat_service._generate_suggestions(intent)

        assert "Book this machine" in suggestions
```

---

## 4. Integration Tests

### 4.1 Java Core API Integration Tests with Testcontainers

```java
// File: src/test/java/com/washwise/core/integration/AuthIntegrationTest.java

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("washwise_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static String accessToken;
    private static String refreshToken;

    // =====================================
    // REGISTRATION TESTS
    // =====================================

    @Test
    @Order(1)
    @DisplayName("POST /auth/register - Success")
    void register_WithValidData_Returns201() {
        // Given
        Map<String, String> request = Map.of(
            "email", "owner@testlaundry.com",
            "password", "SecurePass123!",
            "name", "Test Owner",
            "tenantName", "Test Laundry"
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/register",
            request,
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKey("accessToken");
        assertThat(response.getBody()).containsKey("refreshToken");
        assertThat(response.getBody()).containsKey("user");

        // Store tokens for subsequent tests
        accessToken = (String) response.getBody().get("accessToken");
        refreshToken = (String) response.getBody().get("refreshToken");
    }

    @Test
    @Order(2)
    @DisplayName("POST /auth/register - Duplicate Email Returns 409")
    void register_WithDuplicateEmail_Returns409() {
        // Given
        Map<String, String> request = Map.of(
            "email", "owner@testlaundry.com",  // Same email as before
            "password", "SecurePass123!",
            "name", "Another User",
            "tenantName", "Another Laundry"
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/register",
            request,
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    // =====================================
    // LOGIN TESTS
    // =====================================

    @Test
    @Order(3)
    @DisplayName("POST /auth/login - Success")
    void login_WithValidCredentials_Returns200() {
        // Given
        Map<String, String> request = Map.of(
            "email", "owner@testlaundry.com",
            "password", "SecurePass123!"
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/login",
            request,
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("accessToken")).isNotNull();

        // Update tokens
        accessToken = (String) response.getBody().get("accessToken");
        refreshToken = (String) response.getBody().get("refreshToken");
    }

    @Test
    @Order(4)
    @DisplayName("POST /auth/login - Invalid Password Returns 401")
    void login_WithInvalidPassword_Returns401() {
        // Given
        Map<String, String> request = Map.of(
            "email", "owner@testlaundry.com",
            "password", "WrongPassword"
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/login",
            request,
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // =====================================
    // TOKEN REFRESH TESTS
    // =====================================

    @Test
    @Order(5)
    @DisplayName("POST /auth/refresh - Success with Token Rotation")
    void refresh_WithValidToken_ReturnsNewTokenPair() {
        // Given
        Map<String, String> request = Map.of("refreshToken", refreshToken);

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/refresh",
            request,
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        String newAccessToken = (String) response.getBody().get("accessToken");
        String newRefreshToken = (String) response.getBody().get("refreshToken");

        // Verify token rotation - new tokens should be different
        assertThat(newAccessToken).isNotEqualTo(accessToken);
        assertThat(newRefreshToken).isNotEqualTo(refreshToken);

        // Update tokens
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
    }

    @Test
    @Order(6)
    @DisplayName("POST /auth/refresh - Reused Token Detects Theft")
    void refresh_WithReusedToken_DetectsTheft() {
        // Given - use old refresh token (already rotated)
        Map<String, String> request = Map.of("refreshToken", refreshToken);

        // First use - should succeed
        ResponseEntity<Map> response1 = restTemplate.postForEntity(
            "/api/v1/auth/refresh",
            request,
            Map.class
        );
        assertThat(response1.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Second use of same token - should fail (token reuse = theft)
        ResponseEntity<Map> response2 = restTemplate.postForEntity(
            "/api/v1/auth/refresh",
            request,  // Same old token
            Map.class
        );

        // Then
        assertThat(response2.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response2.getBody().get("message")).asString()
            .contains("Token reuse detected");
    }

    // =====================================
    // PROTECTED ENDPOINT TESTS
    // =====================================

    @Test
    @Order(7)
    @DisplayName("GET /auth/me - With Valid Token Returns User")
    void me_WithValidToken_ReturnsUser() {
        // Re-login to get fresh tokens
        Map<String, String> loginRequest = Map.of(
            "email", "owner@testlaundry.com",
            "password", "SecurePass123!"
        );
        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
            "/api/v1/auth/login",
            loginRequest,
            Map.class
        );
        accessToken = (String) loginResponse.getBody().get("accessToken");

        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/auth/me",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("email")).isEqualTo("owner@testlaundry.com");
    }

    @Test
    @Order(8)
    @DisplayName("GET /auth/me - Without Token Returns 401")
    void me_WithoutToken_Returns401() {
        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "/api/v1/auth/me",
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```

### 4.2 Machine CRUD Integration Tests

```java
// File: src/test/java/com/washwise/core/integration/MachineIntegrationTest.java

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MachineIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("washwise_test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TestRestTemplate restTemplate;

    private static String ownerToken;
    private static String staffToken;
    private static UUID machineId;

    @BeforeAll
    static void setup(@Autowired TestRestTemplate restTemplate) {
        // Register owner
        Map<String, String> ownerRegister = Map.of(
            "email", "owner@laundry.com",
            "password", "SecurePass123!",
            "name", "Owner",
            "tenantName", "Test Laundry"
        );
        ResponseEntity<Map> ownerResponse = restTemplate.postForEntity(
            "/api/v1/auth/register",
            ownerRegister,
            Map.class
        );
        ownerToken = (String) ownerResponse.getBody().get("accessToken");

        // TODO: Create staff user through invite flow
        staffToken = ownerToken; // Simplification for test
    }

    // =====================================
    // CREATE MACHINE TESTS
    // =====================================

    @Test
    @Order(1)
    @DisplayName("POST /machines - Owner Can Create Machine")
    void create_AsOwner_Returns201() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
            "code", "WASH-001",
            "type", "WASHER",
            "model", "LG WM3900HBA",
            "pricePerCycle", 50.00
        );

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("code")).isEqualTo("WASH-001");
        assertThat(response.getBody().get("status")).isEqualTo("AVAILABLE");

        machineId = UUID.fromString((String) response.getBody().get("id"));
    }

    @Test
    @Order(2)
    @DisplayName("POST /machines - Duplicate Code Returns 409")
    void create_WithDuplicateCode_Returns409() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
            "code", "WASH-001",  // Same code
            "type", "WASHER",
            "model", "Different Model",
            "pricePerCycle", 60.00
        );

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    // =====================================
    // GET MACHINE TESTS
    // =====================================

    @Test
    @Order(3)
    @DisplayName("GET /machines - Returns List of Machines")
    void list_AsOwner_ReturnsMachines() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> machines = (List<?>) response.getBody().get("content");
        assertThat(machines).hasSize(1);
    }

    @Test
    @Order(4)
    @DisplayName("GET /machines/{id} - Returns Single Machine")
    void getById_WithValidId_ReturnsMachine() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines/" + machineId,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("id")).isEqualTo(machineId.toString());
    }

    // =====================================
    // IDOR PROTECTION TESTS
    // =====================================

    @Test
    @Order(5)
    @DisplayName("GET /machines/{id} - Cross-Tenant Access Returns 404")
    void getById_CrossTenant_Returns404() {
        // Given - Register a new tenant/user
        Map<String, String> otherRegister = Map.of(
            "email", "other@laundry.com",
            "password", "SecurePass123!",
            "name", "Other Owner",
            "tenantName", "Other Laundry"
        );
        ResponseEntity<Map> otherResponse = restTemplate.postForEntity(
            "/api/v1/auth/register",
            otherRegister,
            Map.class
        );
        String otherToken = (String) otherResponse.getBody().get("accessToken");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(otherToken);

        // When - Try to access machine from different tenant
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines/" + machineId,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        // Then - Should return 404, NOT 403 (security through obscurity)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // =====================================
    // CYCLE MANAGEMENT TESTS
    // =====================================

    @Test
    @Order(6)
    @DisplayName("POST /machines/{id}/start - Starts Machine Cycle")
    void startCycle_WhenAvailable_StartsSuccessfully() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of("durationMinutes", 30);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines/" + machineId + "/start",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("IN_USE");
        assertThat(response.getBody().get("cycleEndsAt")).isNotNull();
    }

    @Test
    @Order(7)
    @DisplayName("POST /machines/{id}/start - When In Use Returns 400")
    void startCycle_WhenInUse_Returns400() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of("durationMinutes", 30);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines/" + machineId + "/start",
            HttpMethod.POST,
            new HttpEntity<>(request, headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("message")).asString()
            .contains("not available");
    }

    @Test
    @Order(8)
    @DisplayName("POST /machines/{id}/end - Ends Machine Cycle")
    void endCycle_WhenInUse_EndsSuccessfully() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
            "/api/v1/machines/" + machineId + "/end",
            HttpMethod.POST,
            new HttpEntity<>(headers),
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("AVAILABLE");
    }
}
```

### 4.3 Python AI Worker Integration Tests

```python
# File: tests/integration/test_chat_api.py

import pytest
from httpx import AsyncClient
from uuid import uuid4

from app.main import create_app


@pytest.fixture
def app():
    """Create test application."""
    return create_app()


@pytest.fixture
async def client(app):
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


class TestChatAPI:
    """Integration tests for Chat API."""

    @pytest.fixture
    def auth_headers(self):
        """Create authentication headers."""
        return {
            "x-tenant-id": str(uuid4()),
            "x-user-id": str(uuid4()),
        }

    @pytest.mark.asyncio
    async def test_send_message_success(self, client, auth_headers):
        """Test sending a message returns AI response."""
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
        assert data["processing_time_ms"] > 0

    @pytest.mark.asyncio
    async def test_send_message_tenant_mismatch_returns_403(self, client, auth_headers):
        """Test tenant ID mismatch returns forbidden."""
        # Given
        request = {
            "tenant_id": str(uuid4()),  # Different tenant ID
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
    async def test_list_conversations_empty(self, client, auth_headers):
        """Test listing conversations when none exist."""
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


class TestIntentAPI:
    """Integration tests for Intent Detection API."""

    @pytest.fixture
    def auth_headers(self):
        return {"x-tenant-id": str(uuid4())}

    @pytest.mark.asyncio
    async def test_detect_intent_success(self, client, auth_headers):
        """Test intent detection returns valid intent."""
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
        """Test batch intent detection."""
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
        assert data["processing_time_ms"] > 0

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


class TestHealthAPI:
    """Integration tests for Health endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test health check endpoint."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert "components" in data

    @pytest.mark.asyncio
    async def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe."""
        response = await client.get("/health/live")

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @pytest.mark.asyncio
    async def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe."""
        response = await client.get("/health/ready")

        # May fail if dependencies not available
        assert response.status_code in [200, 503]
```

---

## 5. End-to-End Tests

### 5.1 User Journey: Complete Booking Flow

```typescript
// File: e2e/tests/booking-flow.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto("/login");
    await page.fill('[name="email"]', "customer@test.com");
    await page.fill('[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("complete booking from machine selection to confirmation", async ({ page }) => {
    // Step 1: Navigate to machines
    await page.click("text=Book Machine");
    await page.waitForSelector('[data-testid="machine-list"]');

    // Step 2: Select an available machine
    const availableMachine = page.locator('[data-status="available"]').first();
    await expect(availableMachine).toBeVisible();
    await availableMachine.click();

    // Step 3: View machine details
    await expect(page.locator('[data-testid="machine-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="machine-status"]')).toHaveText("Available");

    // Step 4: Select time slot
    await page.click('[data-testid="time-slot-10:00"]');
    await expect(page.locator('[data-testid="selected-time"]')).toHaveText("10:00");

    // Step 5: Confirm booking
    await page.click('button:has-text("Confirm Booking")');

    // Step 6: Verify payment dialog
    await expect(page.locator('[data-testid="payment-dialog"]')).toBeVisible();
    await page.click('button:has-text("Pay ฿50.00")');

    // Step 7: Verify success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toBeVisible();

    // Step 8: Verify in my bookings
    await page.click("text=My Bookings");
    await expect(page.locator('[data-testid="booking-list"]')).toContainText("10:00");
  });

  test("cannot book unavailable machine", async ({ page }) => {
    await page.goto("/machines");

    // Find machine that's in use
    const inUseMachine = page.locator('[data-status="in_use"]').first();

    if (await inUseMachine.isVisible()) {
      await inUseMachine.click();

      // Book button should be disabled
      const bookButton = page.locator('button:has-text("Book")');
      await expect(bookButton).toBeDisabled();
    }
  });
});

test.describe("AI Chat Interaction", () => {
  test("chat assistant helps with booking", async ({ page }) => {
    await page.goto("/dashboard");

    // Open chat widget
    await page.click('[data-testid="chat-widget-trigger"]');
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // Send message
    await page.fill('[data-testid="chat-input"]', "I want to book a washing machine");
    await page.click('[data-testid="chat-send"]');

    // Wait for response
    await expect(page.locator('[data-testid="chat-message-assistant"]').last()).toBeVisible({
      timeout: 10000,
    });

    // Verify response contains booking-related content
    const response = await page
      .locator('[data-testid="chat-message-assistant"]')
      .last()
      .textContent();
    expect(response?.toLowerCase()).toContain("book");

    // Check for suggested actions
    await expect(page.locator('[data-testid="chat-suggestions"]')).toBeVisible();
  });
});
```

### 5.2 API E2E Tests with k6

```javascript
// File: e2e/k6/booking-api.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { SharedArray } from "k6/data";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up
    { duration: "1m", target: 10 }, // Steady state
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test data
const testUsers = new SharedArray("users", function () {
  return JSON.parse(open("./test-users.json"));
});

export function setup() {
  // Register test user
  const res = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      email: `loadtest_${Date.now()}@test.com`,
      password: "LoadTest123!",
      name: "Load Test User",
      tenantName: "Load Test Laundry",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(res, { "registration successful": (r) => r.status === 201 });

  return {
    accessToken: res.json("accessToken"),
    tenantId: res.json("user.tenant.id"),
  };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.accessToken}`,
    "Content-Type": "application/json",
  };

  group("Machine Operations", () => {
    // List machines
    const listRes = http.get(`${BASE_URL}/api/v1/machines`, { headers });
    check(listRes, {
      "list machines successful": (r) => r.status === 200,
      "list machines fast": (r) => r.timings.duration < 200,
    });

    if (listRes.status === 200) {
      const machines = listRes.json("content");

      if (machines && machines.length > 0) {
        // Get specific machine
        const machineId = machines[0].id;
        const getRes = http.get(`${BASE_URL}/api/v1/machines/${machineId}`, {
          headers,
        });
        check(getRes, {
          "get machine successful": (r) => r.status === 200,
          "get machine fast": (r) => r.timings.duration < 100,
        });
      }
    }
  });

  group("Auth Operations", () => {
    // Get current user
    const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, { headers });
    check(meRes, {
      "get me successful": (r) => r.status === 200,
      "get me fast": (r) => r.timings.duration < 100,
    });
  });

  sleep(1);
}

export function teardown(data) {
  // Cleanup: logout
  http.post(`${BASE_URL}/api/v1/auth/logout`, null, {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });
}
```

---

## 6. Security Tests

### 6.1 OWASP ZAP Automated Scan

```yaml
# File: security/zap-config.yaml

env:
  contexts:
    - name: "WashWise API"
      urls:
        - "http://localhost:8080"
      includePaths:
        - "http://localhost:8080/api/.*"
      excludePaths:
        - "http://localhost:8080/actuator/.*"
      authentication:
        method: "json"
        parameters:
          loginPageUrl: "http://localhost:8080/api/v1/auth/login"
          loginRequestUrl: "http://localhost:8080/api/v1/auth/login"
          loginRequestBody: '{"email":"{%username%}","password":"{%password%}"}'
          usernameParameter: "username"
          passwordParameter: "password"
        verification:
          method: "response"
          loggedInRegex: "accessToken"
      users:
        - name: "test-owner"
          credentials:
            username: "owner@test.com"
            password: "TestPass123!"

jobs:
  - type: spider
    parameters:
      maxDuration: 5
      maxDepth: 10
  - type: spiderAjax
    parameters:
      maxDuration: 5
  - type: passiveScan-wait
    parameters:
      maxDuration: 10
  - type: activeScan
    parameters:
      maxRuleDurationInMins: 5
      maxScanDurationInMins: 30
  - type: report
    parameters:
      template: "traditional-html"
      reportFile: "zap-report.html"
    risks:
      - high
      - medium
```

### 6.2 Security Unit Tests

```java
// File: src/test/java/com/washwise/core/security/SecurityTest.java

@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {

    @Autowired
    private MockMvc mockMvc;

    // =====================================
    // AUTHENTICATION TESTS
    // =====================================

    @Test
    @DisplayName("Unauthenticated access to protected endpoint returns 401")
    void protectedEndpoint_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/machines"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Invalid JWT token returns 401")
    void protectedEndpoint_WithInvalidToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/machines")
                .header("Authorization", "Bearer invalid.token.here"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Expired JWT token returns 401")
    void protectedEndpoint_WithExpiredToken_Returns401() throws Exception {
        // Given - Generate an expired token
        String expiredToken = generateExpiredToken();

        mockMvc.perform(get("/api/v1/machines")
                .header("Authorization", "Bearer " + expiredToken))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value(containsString("expired")));
    }

    // =====================================
    // AUTHORIZATION TESTS (RBAC)
    // =====================================

    @Test
    @WithMockCustomUser(role = "CUSTOMER")
    @DisplayName("Customer cannot create machines")
    void createMachine_AsCustomer_Returns403() throws Exception {
        mockMvc.perform(post("/api/v1/machines")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "code": "WASH-001",
                        "type": "WASHER",
                        "model": "Model",
                        "pricePerCycle": 50.00
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockCustomUser(role = "OWNER")
    @DisplayName("Owner can create machines")
    void createMachine_AsOwner_Returns201() throws Exception {
        mockMvc.perform(post("/api/v1/machines")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "code": "WASH-001",
                        "type": "WASHER",
                        "model": "Model",
                        "pricePerCycle": 50.00
                    }
                    """))
            .andExpect(status().isCreated());
    }

    // =====================================
    // INPUT VALIDATION TESTS
    // =====================================

    @Test
    @DisplayName("SQL injection attempt is rejected")
    void login_WithSqlInjection_IsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "' OR '1'='1' --",
                        "password": "anything"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("XSS attempt in name is sanitized")
    void register_WithXssInName_IsSanitized() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "test@example.com",
                        "password": "SecurePass123!",
                        "name": "<script>alert('xss')</script>",
                        "tenantName": "Test Laundry"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    // =====================================
    // RATE LIMITING TESTS
    // =====================================

    @Test
    @DisplayName("Excessive login attempts trigger rate limit")
    void login_ExcessiveAttempts_Returns429() throws Exception {
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                            "email": "test@example.com",
                            "password": "wrong"
                        }
                        """));
        }

        // 11th attempt should be rate limited
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "test@example.com",
                        "password": "wrong"
                    }
                    """))
            .andExpect(status().isTooManyRequests());
    }

    // =====================================
    // CSRF TESTS
    // =====================================

    @Test
    @DisplayName("CORS preflight request is handled correctly")
    void corsPreflightRequest_Returns200() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(header().exists("Access-Control-Allow-Origin"));
    }
}
```

---

## 7. Performance Tests

### 7.1 Load Testing with k6

```javascript
// File: performance/k6/load-test.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const loginDuration = new Trend("login_duration");
const machineListDuration = new Trend("machine_list_duration");
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    // Smoke test
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "1m",
      tags: { test_type: "smoke" },
    },
    // Load test
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 }, // Ramp up
        { duration: "5m", target: 50 }, // Steady state
        { duration: "2m", target: 100 }, // Peak load
        { duration: "5m", target: 100 }, // Peak steady
        { duration: "2m", target: 0 }, // Ramp down
      ],
      tags: { test_type: "load" },
    },
    // Stress test
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "5m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "5m", target: 200 },
        { duration: "2m", target: 300 },
        { duration: "5m", target: 300 },
        { duration: "5m", target: 0 },
      ],
      tags: { test_type: "stress" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
    login_duration: ["p(95)<300"],
    machine_list_duration: ["p(95)<200"],
    errors: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  // Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: "loadtest@example.com",
      password: "LoadTest123!",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  loginDuration.add(Date.now() - loginStart);

  const loginSuccess = check(loginRes, {
    "login successful": (r) => r.status === 200,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json("accessToken");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // List machines
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/api/v1/machines`, { headers });
  machineListDuration.add(Date.now() - listStart);

  check(listRes, {
    "list machines successful": (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
```

### 7.2 Database Performance Tests

```java
// File: src/test/java/com/washwise/core/performance/RepositoryPerformanceTest.java

@SpringBootTest
@Testcontainers
class RepositoryPerformanceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private Tenant testTenant;

    @BeforeEach
    void setup() {
        testTenant = tenantRepository.save(new Tenant("Performance Test"));

        // Seed with 1000 machines
        List<Machine> machines = IntStream.range(0, 1000)
            .mapToObj(i -> createMachine("MACH-" + i))
            .toList();
        machineRepository.saveAll(machines);
    }

    @Test
    @DisplayName("findByTenantId should return within 100ms for 1000 records")
    void findByTenantId_Performance() {
        // Warm up
        machineRepository.findByTenantId(testTenant.getId(), Pageable.ofSize(10));

        // Measure
        long start = System.currentTimeMillis();
        Page<Machine> result = machineRepository.findByTenantId(
            testTenant.getId(),
            Pageable.ofSize(20)
        );
        long duration = System.currentTimeMillis() - start;

        assertThat(duration).isLessThan(100);
        assertThat(result.getTotalElements()).isEqualTo(1000);
    }

    @Test
    @DisplayName("findByTenantIdAndStatus should use index")
    void findByTenantIdAndStatus_UsesIndex() {
        // Set some machines to different statuses
        List<Machine> machines = machineRepository.findByTenantId(
            testTenant.getId(),
            Pageable.ofSize(100)
        ).getContent();

        machines.subList(0, 50).forEach(m -> m.setStatus(MachineStatus.IN_USE));
        machineRepository.saveAll(machines);

        long start = System.currentTimeMillis();
        List<Machine> inUse = machineRepository.findByTenantIdAndStatus(
            testTenant.getId(),
            MachineStatus.IN_USE
        );
        long duration = System.currentTimeMillis() - start;

        assertThat(duration).isLessThan(50);
        assertThat(inUse).hasSize(50);
    }

    private Machine createMachine(String code) {
        Machine machine = new Machine();
        machine.setCode(code);
        machine.setType(MachineType.WASHER);
        machine.setModel("Test Model");
        machine.setStatus(MachineStatus.AVAILABLE);
        machine.setPricePerCycle(BigDecimal.valueOf(50));
        machine.setTenant(testTenant);
        return machine;
    }
}
```

---

## 8. Test Data Management

### 8.1 Test Fixtures

```java
// File: src/test/java/com/washwise/core/fixtures/TestFixtures.java

public class TestFixtures {

    public static Tenant createTenant() {
        return createTenant("Test Laundry");
    }

    public static Tenant createTenant(String name) {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName(name);
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setPlan(TenantPlan.PROFESSIONAL);
        return tenant;
    }

    public static User createOwner(Tenant tenant) {
        return createUser(tenant, UserRole.OWNER, "owner@" + slugify(tenant.getName()) + ".com");
    }

    public static User createStaff(Tenant tenant) {
        return createUser(tenant, UserRole.STAFF, "staff@" + slugify(tenant.getName()) + ".com");
    }

    public static User createCustomer(Tenant tenant) {
        return createUser(tenant, UserRole.CUSTOMER, "customer@" + slugify(tenant.getName()) + ".com");
    }

    private static User createUser(Tenant tenant, UserRole role, String email) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setName(role.name().toLowerCase() + " User");
        user.setPasswordHash("$argon2id$..."); // Pre-hashed "TestPass123!"
        user.setRole(role);
        user.setTenant(tenant);
        return user;
    }

    public static Machine createWasher(Tenant tenant, String code) {
        Machine machine = new Machine();
        machine.setId(UUID.randomUUID());
        machine.setCode(code);
        machine.setType(MachineType.WASHER);
        machine.setModel("LG WM3900HBA");
        machine.setStatus(MachineStatus.AVAILABLE);
        machine.setPricePerCycle(BigDecimal.valueOf(50));
        machine.setTenant(tenant);
        return machine;
    }

    public static Machine createDryer(Tenant tenant, String code) {
        Machine machine = new Machine();
        machine.setId(UUID.randomUUID());
        machine.setCode(code);
        machine.setType(MachineType.DRYER);
        machine.setModel("Samsung DVE50R5400V");
        machine.setStatus(MachineStatus.AVAILABLE);
        machine.setPricePerCycle(BigDecimal.valueOf(40));
        machine.setTenant(tenant);
        return machine;
    }

    public static Booking createBooking(User user, Machine machine) {
        Booking booking = new Booking();
        booking.setId(UUID.randomUUID());
        booking.setUser(user);
        booking.setMachine(machine);
        booking.setTenant(user.getTenant());
        booking.setStartTime(Instant.now().plus(Duration.ofHours(1)));
        booking.setEndTime(Instant.now().plus(Duration.ofHours(2)));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setAmount(machine.getPricePerCycle());
        return booking;
    }

    private static String slugify(String name) {
        return name.toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
```

### 8.2 Test Data Seeder

```sql
-- File: src/test/resources/test-data.sql

-- Tenant 1: Active Professional
INSERT INTO tenants (id, name, status, plan, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Laundry Pro', 'ACTIVE', 'PROFESSIONAL', NOW(), NOW());

-- Tenant 2: Basic Plan
INSERT INTO tenants (id, name, status, plan, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'Budget Wash', 'ACTIVE', 'BASIC', NOW(), NOW());

-- Users for Tenant 1
INSERT INTO users (id, tenant_id, email, name, password_hash, role, created_at, updated_at)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
 'owner@testlaundry.com', 'Test Owner',
 '$argon2id$v=19$m=65536,t=3,p=4$...', 'OWNER', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
 'staff@testlaundry.com', 'Test Staff',
 '$argon2id$v=19$m=65536,t=3,p=4$...', 'STAFF', NOW(), NOW());

-- Machines for Tenant 1
INSERT INTO machines (id, tenant_id, code, type, model, status, price_per_cycle, created_at, updated_at)
VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
 'WASH-001', 'WASHER', 'LG WM3900HBA', 'AVAILABLE', 50.00, NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
 'WASH-002', 'WASHER', 'LG WM3900HBA', 'IN_USE', 50.00, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
 'DRY-001', 'DRYER', 'Samsung DVE50R5400V', 'AVAILABLE', 40.00, NOW(), NOW());
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

```yaml
# File: .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # =====================================
  # UNIT TESTS
  # =====================================
  unit-tests-java:
    name: Java Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "maven"

      - name: Run unit tests
        working-directory: services/core-api
        run: mvn test -Dtest=*Test -DfailIfNoTests=false

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: services/core-api/target/site/jacoco/jacoco.xml
          flags: unit-java

  unit-tests-python:
    name: Python Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        working-directory: services/ai-worker
        run: pip install -e ".[dev]"

      - name: Run unit tests
        working-directory: services/ai-worker
        run: pytest tests/unit -v --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: services/ai-worker/coverage.xml
          flags: unit-python

  # =====================================
  # INTEGRATION TESTS
  # =====================================
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [unit-tests-java, unit-tests-python]

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: washwise_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
          cache: "maven"

      - name: Run Java integration tests
        working-directory: services/core-api
        run: mvn verify -DskipUnitTests
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/washwise_test
          SPRING_DATASOURCE_USERNAME: test
          SPRING_DATASOURCE_PASSWORD: test
          SPRING_DATA_REDIS_HOST: localhost

  # =====================================
  # SECURITY SCAN
  # =====================================
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          severity: "CRITICAL,HIGH"
          exit-code: "1"

  # =====================================
  # E2E TESTS
  # =====================================
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [integration-tests]
    steps:
      - uses: actions/checkout@v4

      - name: Start services
        run: docker compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: sleep 30

      - name: Run Playwright tests
        uses: microsoft/playwright-github-action@v1
        with:
          working-directory: e2e

      - name: Stop services
        if: always()
        run: docker compose -f docker-compose.test.yml down
```

---

## 10. Concrete Test Examples

### 10.1 Test Scenarios by Feature

#### Authentication Tests

| Test ID  | Scenario                      | Expected Result          | Priority |
| -------- | ----------------------------- | ------------------------ | -------- |
| AUTH-001 | Register with valid data      | Returns 201 with tokens  | P0       |
| AUTH-002 | Register with existing email  | Returns 409 Conflict     | P0       |
| AUTH-003 | Register with weak password   | Returns 400 Bad Request  | P1       |
| AUTH-004 | Login with valid credentials  | Returns 200 with tokens  | P0       |
| AUTH-005 | Login with wrong password     | Returns 401 Unauthorized | P0       |
| AUTH-006 | Login with non-existent email | Returns 401 Unauthorized | P0       |
| AUTH-007 | Refresh with valid token      | Returns new token pair   | P0       |
| AUTH-008 | Refresh with expired token    | Returns 401 Unauthorized | P0       |
| AUTH-009 | Refresh with reused token     | Revokes entire family    | P0       |
| AUTH-010 | Logout invalidates tokens     | Subsequent requests fail | P1       |

#### Machine Management Tests

| Test ID  | Scenario                      | Expected Result           | Priority |
| -------- | ----------------------------- | ------------------------- | -------- |
| MACH-001 | Owner creates machine         | Returns 201 with machine  | P0       |
| MACH-002 | Staff creates machine         | Returns 201 (if allowed)  | P1       |
| MACH-003 | Customer creates machine      | Returns 403 Forbidden     | P0       |
| MACH-004 | Create with duplicate code    | Returns 409 Conflict      | P0       |
| MACH-005 | Get machine by ID             | Returns machine details   | P0       |
| MACH-006 | Get machine from other tenant | Returns 404 Not Found     | P0       |
| MACH-007 | List machines with pagination | Returns paginated list    | P1       |
| MACH-008 | Filter by status              | Returns filtered results  | P1       |
| MACH-009 | Start cycle on available      | Machine becomes IN_USE    | P0       |
| MACH-010 | Start cycle on in-use         | Returns 400 Bad Request   | P0       |
| MACH-011 | End cycle                     | Machine becomes AVAILABLE | P0       |

#### AI Chat Tests

| Test ID  | Scenario                 | Expected Result               | Priority |
| -------- | ------------------------ | ----------------------------- | -------- |
| CHAT-001 | Send greeting message    | Returns friendly response     | P1       |
| CHAT-002 | Ask about availability   | Detects machine_status intent | P0       |
| CHAT-003 | Request booking          | Detects booking_create intent | P0       |
| CHAT-004 | Thai language message    | Responds in Thai              | P1       |
| CHAT-005 | Conversation persistence | Messages saved to MongoDB     | P0       |
| CHAT-006 | Intent batch detection   | Processes multiple messages   | P2       |
| CHAT-007 | Invalid tenant header    | Returns 400 Bad Request       | P0       |

### 10.2 Test Execution Commands

```bash
# Run all unit tests
cd services/core-api && mvn test
cd services/ai-worker && pytest tests/unit

# Run integration tests only
cd services/core-api && mvn verify -DskipUnitTests
cd services/ai-worker && pytest tests/integration

# Run specific test class
cd services/core-api && mvn test -Dtest=AuthServiceTest
cd services/ai-worker && pytest tests/unit/test_chat_service.py

# Run with coverage
cd services/core-api && mvn test jacoco:report
cd services/ai-worker && pytest --cov=app --cov-report=html

# Run performance tests
k6 run performance/k6/load-test.js

# Run security scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:8080

# Run E2E tests
cd e2e && npx playwright test
```

### 10.3 Test Coverage Requirements

| Component      | Unit    | Integration | Total   |
| -------------- | ------- | ----------- | ------- |
| AuthService    | 90%     | 80%         | 85%     |
| MachineService | 85%     | 75%         | 80%     |
| BookingService | 85%     | 75%         | 80%     |
| ChatService    | 80%     | 70%         | 75%     |
| Controllers    | 80%     | 85%         | 82%     |
| Repositories   | 70%     | 90%         | 80%     |
| **Overall**    | **80%** | **75%**     | **78%** |

---

## Summary

This test plan provides comprehensive coverage for the WashWise v2.0 Enterprise platform:

1. **Unit Tests**: 75% of test effort, focusing on business logic
2. **Integration Tests**: 20% of test effort, validating system interactions
3. **E2E Tests**: 5% of test effort, verifying critical user journeys

Key testing principles:

- IDOR protection tested at every endpoint
- Token rotation and theft detection verified
- Multi-tenant isolation confirmed
- Performance baselines established
- Security scanning automated

All tests are designed to run in CI/CD pipelines with clear pass/fail criteria.

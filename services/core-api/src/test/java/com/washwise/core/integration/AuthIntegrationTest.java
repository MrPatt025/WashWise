package com.washwise.core.integration;

import com.washwise.core.domain.tenant.Tenant;
import com.washwise.core.domain.tenant.TenantStatus;
import com.washwise.core.domain.user.User;
import com.washwise.core.domain.user.UserRole;
import com.washwise.core.repository.TenantRepository;
import com.washwise.core.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Authentication endpoints.
 * Uses Testcontainers for PostgreSQL and Redis.
 */
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
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static String accessToken;
    private static String refreshToken;
    private static String oldRefreshToken;

    // =====================================
    // REGISTRATION TESTS
    // =====================================

    @Test
    @Order(1)
    @DisplayName("POST /auth/register - Success with valid data")
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

        // Verify user was created in database
        assertThat(userRepository.existsByEmail("owner@testlaundry.com")).isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("POST /auth/register - Duplicate email returns 409")
    void register_WithDuplicateEmail_Returns409() {
        // Given - same email as previous test
        Map<String, String> request = Map.of(
                "email", "owner@testlaundry.com",
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
        assertThat(response.getBody().get("message")).asString()
                .containsIgnoringCase("email");
    }

    @Test
    @Order(3)
    @DisplayName("POST /auth/register - Weak password returns 400")
    void register_WithWeakPassword_Returns400() {
        // Given
        Map<String, String> request = Map.of(
                "email", "weak@test.com",
                "password", "weak",
                "name", "Weak User",
                "tenantName", "Weak Laundry"
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/register",
                request,
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // =====================================
    // LOGIN TESTS
    // =====================================

    @Test
    @Order(4)
    @DisplayName("POST /auth/login - Success with valid credentials")
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
        assertThat(response.getBody().get("refreshToken")).isNotNull();

        // Update tokens
        accessToken = (String) response.getBody().get("accessToken");
        refreshToken = (String) response.getBody().get("refreshToken");
    }

    @Test
    @Order(5)
    @DisplayName("POST /auth/login - Invalid password returns 401")
    void login_WithInvalidPassword_Returns401() {
        // Given
        Map<String, String> request = Map.of(
                "email", "owner@testlaundry.com",
                "password", "WrongPassword123!"
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

    @Test
    @Order(6)
    @DisplayName("POST /auth/login - Non-existent user returns 401")
    void login_WithNonExistentUser_Returns401() {
        // Given
        Map<String, String> request = Map.of(
                "email", "nonexistent@test.com",
                "password", "AnyPassword123!"
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
    @Order(7)
    @DisplayName("POST /auth/refresh - Success with token rotation")
    void refresh_WithValidToken_ReturnsNewTokenPair() {
        // Given - store old token for theft detection test
        oldRefreshToken = refreshToken;
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

        // Verify token rotation - tokens should be different
        assertThat(newAccessToken).isNotEqualTo(accessToken);
        assertThat(newRefreshToken).isNotEqualTo(refreshToken);

        // Update tokens
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
    }

    @Test
    @Order(8)
    @DisplayName("POST /auth/refresh - Reused token detects theft")
    void refresh_WithReusedToken_DetectsTheft() {
        // Given - use the OLD refresh token (already rotated)
        Map<String, String> request = Map.of("refreshToken", oldRefreshToken);

        // When - attempt to reuse old token (simulates token theft)
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/refresh",
                request,
                Map.class
        );

        // Then - should fail and revoke entire token family
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().get("message")).asString()
                .containsIgnoringCase("reuse");
    }

    // =====================================
    // PROTECTED ENDPOINT TESTS
    // =====================================

    @Test
    @Order(9)
    @DisplayName("GET /auth/me - Success with valid token")
    void me_WithValidToken_ReturnsUser() {
        // Re-login to get fresh tokens (old ones revoked due to theft detection)
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
        assertThat(response.getBody().get("role")).isEqualTo("OWNER");
    }

    @Test
    @Order(10)
    @DisplayName("GET /auth/me - Without token returns 401")
    void me_WithoutToken_Returns401() {
        // When - no Authorization header
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/api/v1/auth/me",
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(11)
    @DisplayName("GET /auth/me - Invalid token returns 401")
    void me_WithInvalidToken_Returns401() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("invalid.jwt.token");

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/auth/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // =====================================
    // LOGOUT TESTS
    // =====================================

    @Test
    @Order(12)
    @DisplayName("POST /auth/logout - Invalidates current session")
    void logout_InvalidatesSession() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        // When
        ResponseEntity<Void> logoutResponse = restTemplate.exchange(
                "/api/v1/auth/logout",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                Void.class
        );

        // Then
        assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Verify token no longer works
        ResponseEntity<Map> meResponse = restTemplate.exchange(
                "/api/v1/auth/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );
        assertThat(meResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}

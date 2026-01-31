package com.washwise.core.integration;

import com.washwise.core.domain.machine.MachineStatus;
import com.washwise.core.domain.machine.MachineType;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Machine endpoints.
 * Tests CRUD operations, IDOR protection, and cycle management.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MachineIntegrationTest {

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

    private static String ownerToken;
    private static String otherOwnerToken;
    private static UUID machineId;

    @BeforeAll
    static void setup(@Autowired TestRestTemplate restTemplate) {
        // Register first owner
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

        // Register second owner (different tenant)
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
        otherOwnerToken = (String) otherResponse.getBody().get("accessToken");
    }

    // =====================================
    // CREATE MACHINE TESTS
    // =====================================

    @Test
    @Order(1)
    @DisplayName("POST /machines - Owner can create machine")
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
        assertThat(response.getBody().get("type")).isEqualTo("WASHER");
        assertThat(response.getBody().get("status")).isEqualTo("AVAILABLE");

        machineId = UUID.fromString((String) response.getBody().get("id"));
    }

    @Test
    @Order(2)
    @DisplayName("POST /machines - Create dryer machine")
    void create_Dryer_Returns201() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
                "code", "DRY-001",
                "type", "DRYER",
                "model", "Samsung DVE50R5400V",
                "pricePerCycle", 40.00
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
        assertThat(response.getBody().get("type")).isEqualTo("DRYER");
    }

    @Test
    @Order(3)
    @DisplayName("POST /machines - Duplicate code returns 409")
    void create_WithDuplicateCode_Returns409() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
                "code", "WASH-001",  // Same code as first machine
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

    @Test
    @Order(4)
    @DisplayName("POST /machines - Without auth returns 401")
    void create_WithoutAuth_Returns401() {
        // Given - no auth header
        Map<String, Object> request = Map.of(
                "code", "WASH-002",
                "type", "WASHER",
                "model", "Model",
                "pricePerCycle", 50.00
        );

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/machines",
                request,
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // =====================================
    // GET MACHINES TESTS
    // =====================================

    @Test
    @Order(5)
    @DisplayName("GET /machines - Returns paginated list")
    void list_AsOwner_ReturnsPaginatedMachines() {
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
        assertThat(machines).hasSize(2);  // WASH-001 and DRY-001
        
        assertThat(response.getBody().get("totalElements")).isEqualTo(2);
    }

    @Test
    @Order(6)
    @DisplayName("GET /machines?type=WASHER - Filters by type")
    void list_FilterByType_ReturnsFilteredMachines() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines?type=WASHER",
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
    @Order(7)
    @DisplayName("GET /machines/{id} - Returns single machine")
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
        assertThat(response.getBody().get("code")).isEqualTo("WASH-001");
    }

    // =====================================
    // IDOR PROTECTION TESTS
    // =====================================

    @Test
    @Order(8)
    @DisplayName("GET /machines/{id} - Cross-tenant access returns 404 (IDOR protection)")
    void getById_CrossTenant_Returns404() {
        // Given - use other owner's token to access first owner's machine
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(otherOwnerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines/" + machineId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        // Then - Should return 404, NOT 403 (security through obscurity)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Order(9)
    @DisplayName("PUT /machines/{id} - Cross-tenant update returns 404")
    void update_CrossTenant_Returns404() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(otherOwnerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> request = Map.of(
                "code", "HACKED-001",
                "type", "WASHER",
                "model", "Hacked Model",
                "pricePerCycle", 0.01
        );

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines/" + machineId,
                HttpMethod.PUT,
                new HttpEntity<>(request, headers),
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Order(10)
    @DisplayName("DELETE /machines/{id} - Cross-tenant delete returns 404")
    void delete_CrossTenant_Returns404() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(otherOwnerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines/" + machineId,
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // =====================================
    // CYCLE MANAGEMENT TESTS
    // =====================================

    @Test
    @Order(11)
    @DisplayName("POST /machines/{id}/start - Starts cycle on available machine")
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
    @Order(12)
    @DisplayName("POST /machines/{id}/start - Returns 400 when machine in use")
    void startCycle_WhenInUse_Returns400() {
        // Given - machine is already in use from previous test
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
                .containsIgnoringCase("not available");
    }

    @Test
    @Order(13)
    @DisplayName("POST /machines/{id}/end - Ends cycle successfully")
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
        assertThat(response.getBody().get("cycleStartedAt")).isNull();
        assertThat(response.getBody().get("cycleEndsAt")).isNull();
    }

    @Test
    @Order(14)
    @DisplayName("POST /machines/{id}/end - Cross-tenant returns 404")
    void endCycle_CrossTenant_Returns404() {
        // First start a cycle
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        restTemplate.exchange(
                "/api/v1/machines/" + machineId + "/start",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("durationMinutes", 30), headers),
                Map.class
        );

        // Given - try to end with different tenant
        HttpHeaders otherHeaders = new HttpHeaders();
        otherHeaders.setBearerAuth(otherOwnerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines/" + machineId + "/end",
                HttpMethod.POST,
                new HttpEntity<>(otherHeaders),
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // =====================================
    // STATISTICS TESTS
    // =====================================

    @Test
    @Order(15)
    @DisplayName("GET /machines/stats - Returns tenant statistics")
    void getStats_AsOwner_ReturnsStats() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(ownerToken);

        // When
        ResponseEntity<Map> response = restTemplate.exchange(
                "/api/v1/machines/stats",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("total");
        assertThat(response.getBody()).containsKey("available");
        assertThat(response.getBody()).containsKey("inUse");
    }
}

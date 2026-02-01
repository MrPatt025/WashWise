package io.washwise.integration;

import io.washwise.domain.machine.Machine;
import io.washwise.domain.machine.MachineStatus;
import io.washwise.domain.machine.MachineType;
import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.tenant.Tenant.TenantStatus;
import io.washwise.domain.user.User;
import io.washwise.domain.user.UserRole;
import io.washwise.domain.user.UserStatus;
import io.washwise.dto.machine.CreateMachineRequest;
import io.washwise.dto.machine.UpdateMachineRequest;
import io.washwise.repository.MachineRepository;
import io.washwise.repository.TenantRepository;
import io.washwise.repository.UserRepository;
import io.washwise.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@SuppressWarnings({ "null", "resource" })
class MachineIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("washwise_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
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
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant testTenant;
    private User adminUser;
    private User staffUser;
    private String adminToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        machineRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();

        // Create test tenant
        testTenant = Tenant.builder()
                .name("Test Laundry")
                .slug("test-laundry")
                .ownerEmail("owner@test.com")
                .status(TenantStatus.ACTIVE)
                .build();
        testTenant = tenantRepository.save(testTenant);

        // Create admin user (OWNER role)
        adminUser = User.builder()
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Admin")
                .lastName("User")
                .role(UserRole.OWNER)
                .tenant(testTenant)
                .status(UserStatus.ACTIVE)
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateAccessToken(adminUser);

        // Create staff user
        staffUser = User.builder()
                .email("staff@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName("Staff")
                .lastName("User")
                .role(UserRole.STAFF)
                .tenant(testTenant)
                .status(UserStatus.ACTIVE)
                .build();
        staffUser = userRepository.save(staffUser);
        staffToken = jwtService.generateAccessToken(staffUser);
    }

    @Test
    void shouldCreateMachine() throws Exception {
        CreateMachineRequest request = new CreateMachineRequest(
                "Washer 001",               // name
                "WASH-001",                 // machineNumber
                MachineType.WASHER,         // type
                new BigDecimal("50.00"),    // pricePerCycle
                45,                         // cycleDurationMinutes
                new BigDecimal("10.0"),     // capacityKg
                "WF45T6000AW",              // model
                "Samsung",                  // manufacturer
                null,                       // serialNumber
                null,                       // iotDeviceId
                null                        // branchId
        );

        mockMvc.perform(post("/api/v1/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Washer 001"))
                .andExpect(jsonPath("$.type").value("WASHER"))
                .andExpect(jsonPath("$.status").value("IDLE"))
                .andExpect(jsonPath("$.pricePerCycle").value(50.00));
    }

    @Test
    void shouldRejectDuplicateMachineNumber() throws Exception {
        CreateMachineRequest request = new CreateMachineRequest(
                "Washer DUP",
                "WASH-DUP",
                MachineType.WASHER,
                new BigDecimal("50.00"),
                45,
                new BigDecimal("10.0"),
                "Model",
                "Samsung",
                null, null, null
        );

        // First creation
        mockMvc.perform(post("/api/v1/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate creation
        mockMvc.perform(post("/api/v1/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldListMachines() throws Exception {
        // Create test machines
        createTestMachine("Washer 1", "WASH-LIST-1", MachineType.WASHER);
        createTestMachine("Dryer 1", "DRY-LIST-1", MachineType.DRYER);

        mockMvc.perform(get("/api/v1/machines")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void shouldFilterMachinesByType() throws Exception {
        createTestMachine("Washer 1", "WASH-FILTER-1", MachineType.WASHER);
        createTestMachine("Dryer 1", "DRY-FILTER-1", MachineType.DRYER);

        mockMvc.perform(get("/api/v1/machines")
                        .header("Authorization", "Bearer " + staffToken)
                        .param("type", "WASHER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Washer 1"));
    }

    @Test
    void shouldFilterMachinesByStatus() throws Exception {
        Machine washer = createTestMachine("Washer 1", "WASH-STATUS-1", MachineType.WASHER);
        washer.setStatus(MachineStatus.RUNNING);
        machineRepository.save(washer);

        createTestMachine("Washer 2", "WASH-STATUS-2", MachineType.WASHER);

        mockMvc.perform(get("/api/v1/machines")
                        .header("Authorization", "Bearer " + staffToken)
                        .param("status", "IDLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Washer 2"));
    }

    @Test
    void shouldGetMachineById() throws Exception {
        Machine machine = createTestMachine("Washer GET", "WASH-GET-1", MachineType.WASHER);

        mockMvc.perform(get("/api/v1/machines/" + machine.getId())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Washer GET"))
                .andExpect(jsonPath("$.type").value("WASHER"));
    }

    @Test
    void shouldReturn404ForNonExistentMachine() throws Exception {
        mockMvc.perform(get("/api/v1/machines/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldUpdateMachine() throws Exception {
        Machine machine = createTestMachine("Washer UPDATE", "WASH-UPDATE-1", MachineType.WASHER);

        UpdateMachineRequest request = new UpdateMachineRequest(
                "Updated Washer",                   // name
                MachineStatus.MAINTENANCE,          // status
                new BigDecimal("60.00"),           // pricePerCycle
                null,                              // cycleDurationMinutes
                null,                              // capacityKg
                null,                              // model
                null                               // manufacturer
        );

        mockMvc.perform(put("/api/v1/machines/" + machine.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Washer"))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"))
                .andExpect(jsonPath("$.pricePerCycle").value(60.00));
    }

    @Test
    void shouldDeleteMachine() throws Exception {
        Machine machine = createTestMachine("Washer DELETE", "WASH-DELETE-1", MachineType.WASHER);

        mockMvc.perform(delete("/api/v1/machines/" + machine.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/machines/" + machine.getId())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldPreventStaffFromCreatingMachine() throws Exception {
        CreateMachineRequest request = new CreateMachineRequest(
                "Washer FORBIDDEN",
                "WASH-FORBIDDEN",
                MachineType.WASHER,
                new BigDecimal("50.00"),
                45,
                new BigDecimal("10.0"),
                "Model",
                "Samsung",
                null, null, null
        );

        mockMvc.perform(post("/api/v1/machines")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldStartMachineCycle() throws Exception {
        Machine machine = createTestMachine("Washer START", "WASH-START-1", MachineType.WASHER);

        mockMvc.perform(post("/api/v1/machines/" + machine.getId() + "/start")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_USE"));
    }

    @Test
    void shouldPreventStartingBusyMachine() throws Exception {
        Machine machine = createTestMachine("Washer BUSY", "WASH-BUSY-1", MachineType.WASHER);
        machine.setStatus(MachineStatus.RUNNING);
        machineRepository.save(machine);

        mockMvc.perform(post("/api/v1/machines/" + machine.getId() + "/start")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldCompleteMachineCycle() throws Exception {
        Machine machine = createTestMachine("Washer COMPLETE", "WASH-COMPLETE-1", MachineType.WASHER);
        machine.setStatus(MachineStatus.RUNNING);
        machineRepository.save(machine);

        mockMvc.perform(post("/api/v1/machines/" + machine.getId() + "/complete")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IDLE"));
    }

    @Test
    void shouldReportMachineFault() throws Exception {
        Machine machine = createTestMachine("Washer FAULT", "WASH-FAULT-1", MachineType.WASHER);

        mockMvc.perform(post("/api/v1/machines/" + machine.getId() + "/fault")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Water leak detected\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ERROR"));
    }

    @Test
    void shouldGetMachineStatistics() throws Exception {
        createTestMachine("Washer 1", "WASH-STATS-1", MachineType.WASHER);
        createTestMachine("Washer 2", "WASH-STATS-2", MachineType.WASHER);
        Machine busyMachine = createTestMachine("Washer 3", "WASH-STATS-3", MachineType.WASHER);
        busyMachine.setStatus(MachineStatus.RUNNING);
        machineRepository.save(busyMachine);

        mockMvc.perform(get("/api/v1/machines/statistics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMachines").value(3))
                .andExpect(jsonPath("$.idleMachines").value(2))
                .andExpect(jsonPath("$.inUseMachines").value(1));
    }

    private Machine createTestMachine(String name, String machineNumber, MachineType type) {
        Machine machine = Machine.builder()
                .name(name)
                .machineNumber(machineNumber)
                .type(type)
                .manufacturer("Samsung")
                .model("Test Model")
                .pricePerCycle(new BigDecimal("50.00"))
                .cycleDurationMinutes(45)
                .status(MachineStatus.IDLE)
                .tenant(testTenant)
                .build();
        return machineRepository.save(machine);
    }
}

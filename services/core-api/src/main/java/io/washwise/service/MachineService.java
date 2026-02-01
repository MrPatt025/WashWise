package io.washwise.service;

import io.washwise.domain.machine.Machine;
import io.washwise.domain.machine.MachineStatus;
import io.washwise.domain.machine.MachineType;
import io.washwise.domain.tenant.Tenant;
import io.washwise.dto.machine.CreateMachineRequest;
import io.washwise.dto.machine.MachineResponse;
import io.washwise.exception.ConflictException;
import io.washwise.exception.NotFoundException;
import io.washwise.repository.MachineRepository;
import io.washwise.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class MachineService {

    private final MachineRepository machineRepository;
    private final TenantRepository tenantRepository;

    /**
     * Get all machines for a tenant with pagination.
     */
    @Transactional(readOnly = true)
    public Page<MachineResponse> getMachines(UUID tenantId, Pageable pageable) {
        return machineRepository.findAllByTenantId(tenantId, pageable)
                .map(MachineResponse::from);
    }

    /**
     * Get all machines for a tenant (no pagination).
     */
    @Transactional(readOnly = true)
    public List<MachineResponse> getAllMachines(UUID tenantId) {
        return machineRepository.findAllByTenantId(tenantId).stream()
                .map(MachineResponse::from)
                .toList();
    }

    /**
     * Get a machine by ID (tenant-scoped).
     * Returns 404 for both non-existent and cross-tenant access (IDOR protection).
     */
    @Transactional(readOnly = true)
    public MachineResponse getMachine(UUID machineId, UUID tenantId) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));
        return MachineResponse.from(machine);
    }

    /**
     * Create a new machine.
     */
    @Transactional
    public MachineResponse createMachine(CreateMachineRequest request, UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NotFoundException("Tenant not found"));

        // Check IoT device ID uniqueness
        if (request.iotDeviceId() != null && machineRepository.existsByIotDeviceId(request.iotDeviceId())) {
            throw new ConflictException("IoT device ID already registered");
        }

        Machine machine = Machine.builder()
                .tenant(tenant)
                .name(request.name())
                .machineNumber(request.machineNumber())
                .type(request.type())
                .status(MachineStatus.IDLE)
                .pricePerCycle(request.pricePerCycle())
                .cycleDurationMinutes(request.cycleDurationMinutes())
                .capacityKg(request.capacityKg())
                .model(request.model())
                .manufacturer(request.manufacturer())
                .serialNumber(request.serialNumber())
                .iotDeviceId(request.iotDeviceId())
                .branchId(request.branchId())
                .build();

        machine = machineRepository.save(machine);
        log.info("Machine created: {} (tenant: {})", machine.getName(), tenantId);

        return MachineResponse.from(machine);
    }

    /**
     * Update a machine.
     */
    @Transactional
    public MachineResponse updateMachine(UUID machineId, CreateMachineRequest request, UUID tenantId) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        // Check IoT device ID uniqueness (if changed)
        if (request.iotDeviceId() != null && 
            !request.iotDeviceId().equals(machine.getIotDeviceId()) &&
            machineRepository.existsByIotDeviceId(request.iotDeviceId())) {
            throw new ConflictException("IoT device ID already registered");
        }

        machine.setName(request.name());
        machine.setMachineNumber(request.machineNumber());
        machine.setType(request.type());
        machine.setPricePerCycle(request.pricePerCycle());
        machine.setCycleDurationMinutes(request.cycleDurationMinutes());
        machine.setCapacityKg(request.capacityKg());
        machine.setModel(request.model());
        machine.setManufacturer(request.manufacturer());
        machine.setSerialNumber(request.serialNumber());
        machine.setIotDeviceId(request.iotDeviceId());
        machine.setBranchId(request.branchId());

        machine = machineRepository.save(machine);
        log.info("Machine updated: {} (tenant: {})", machine.getName(), tenantId);

        return MachineResponse.from(machine);
    }

    /**
     * Delete a machine.
     */
    @Transactional
    public void deleteMachine(UUID machineId, UUID tenantId) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        if (machine.getStatus() == MachineStatus.RUNNING) {
            throw new ConflictException("Cannot delete machine while in use");
        }

        machineRepository.delete(machine);
        log.info("Machine deleted: {} (tenant: {})", machineId, tenantId);
    }

    /**
     * Start a cycle on a machine (for simulation/testing).
     */
    @Transactional
    public MachineResponse startCycle(UUID machineId, UUID tenantId) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        machine.startCycle();
        machine = machineRepository.save(machine);
        
        log.info("Cycle started on machine: {} (tenant: {})", machineId, tenantId);
        return MachineResponse.from(machine);
    }

    /**
     * Complete a cycle on a machine (for simulation/testing).
     */
    @Transactional
    public MachineResponse completeCycle(UUID machineId, UUID tenantId) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        machine.completeCycle();
        machine = machineRepository.save(machine);
        
        log.info("Cycle completed on machine: {} (tenant: {})", machineId, tenantId);
        return MachineResponse.from(machine);
    }

    /**
     * Set machine error (for simulation/testing).
     */
    @Transactional
    public MachineResponse setMachineError(UUID machineId, UUID tenantId, String errorCode, String errorMessage) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        machine.setError(errorCode, errorMessage);
        machine = machineRepository.save(machine);
        
        log.warn("Error set on machine: {} - {} (tenant: {})", machineId, errorCode, tenantId);
        return MachineResponse.from(machine);
    }

    /**
     * Get available machines by type.
     */
    @Transactional(readOnly = true)
    public List<MachineResponse> getAvailableMachines(UUID tenantId, MachineType type) {
        return machineRepository.findAvailableByType(tenantId, type, MachineStatus.IDLE).stream()
                .map(MachineResponse::from)
                .toList();
    }

    /**
     * Get machine statistics for a tenant.
     */
    @Transactional(readOnly = true)
    public MachineStats getStats(UUID tenantId) {
        long total = machineRepository.countByTenantId(tenantId);
        long idle = machineRepository.countByTenantIdAndStatus(tenantId, MachineStatus.IDLE);
        long inUse = machineRepository.countByTenantIdAndStatus(tenantId, MachineStatus.RUNNING);
        long error = machineRepository.countByTenantIdAndStatus(tenantId, MachineStatus.ERROR);
        long maintenance = machineRepository.countByTenantIdAndStatus(tenantId, MachineStatus.MAINTENANCE);

        return new MachineStats(total, idle, inUse, error, maintenance);
    }

    public record MachineStats(
            long total,
            long idle,
            long inUse,
            long error,
            long maintenance
    ) {}
}

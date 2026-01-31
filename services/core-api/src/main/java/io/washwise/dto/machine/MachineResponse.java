package io.washwise.dto.machine;

import io.washwise.domain.machine.Machine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MachineResponse(
        UUID id,
        String name,
        String machineNumber,
        Machine.MachineType type,
        Machine.MachineStatus status,
        BigDecimal pricePerCycle,
        Integer cycleDurationMinutes,
        BigDecimal capacityKg,
        String model,
        String manufacturer,
        String serialNumber,
        String iotDeviceId,
        UUID branchId,
        Long totalCycles,
        Instant lastMaintenanceAt,
        Instant currentCycleStartedAt,
        Instant currentCycleEndsAt,
        Long remainingSeconds,
        Integer progressPercent,
        String errorCode,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public static MachineResponse from(Machine machine) {
        return new MachineResponse(
                machine.getId(),
                machine.getName(),
                machine.getMachineNumber(),
                machine.getType(),
                machine.getStatus(),
                machine.getPricePerCycle(),
                machine.getCycleDurationMinutes(),
                machine.getCapacityKg(),
                machine.getModel(),
                machine.getManufacturer(),
                machine.getSerialNumber(),
                machine.getIotDeviceId(),
                machine.getBranchId(),
                machine.getTotalCycles(),
                machine.getLastMaintenanceAt(),
                machine.getCurrentCycleStartedAt(),
                machine.getCurrentCycleEndsAt(),
                machine.getRemainingSeconds(),
                machine.getProgressPercent(),
                machine.getErrorCode(),
                machine.getErrorMessage(),
                machine.getCreatedAt(),
                machine.getUpdatedAt()
        );
    }
}

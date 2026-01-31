package io.washwise.dto.machine;

import io.washwise.domain.machine.MachineType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateMachineRequest(
        @NotBlank(message = "Machine name is required")
        @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters")
        String name,

        @Size(max = 20)
        String machineNumber,

        @NotNull(message = "Machine type is required")
        MachineType type,

        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @Digits(integer = 8, fraction = 2)
        BigDecimal pricePerCycle,

        @Min(value = 1, message = "Cycle duration must be at least 1 minute")
        @Max(value = 240, message = "Cycle duration cannot exceed 240 minutes")
        Integer cycleDurationMinutes,

        @DecimalMin(value = "0.1")
        @Digits(integer = 3, fraction = 2)
        BigDecimal capacityKg,

        @Size(max = 100)
        String model,

        @Size(max = 100)
        String manufacturer,

        @Size(max = 100)
        String serialNumber,

        @Size(max = 100)
        String iotDeviceId,

        UUID branchId
) {
    public CreateMachineRequest {
        if (cycleDurationMinutes == null) {
            cycleDurationMinutes = 45;
        }
    }
}

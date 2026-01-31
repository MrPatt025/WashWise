package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineUtilization {
    private UUID machineId;
    private String machineName;
    private double utilizationPct;
    private int totalHoursUsed;
}

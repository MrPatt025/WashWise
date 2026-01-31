package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilizationAnalytics {
    private LocalDate date;
    private double overallUtilization;
    private Integer peakHour;
    private List<MachineUtilization> machineUtilization;
    private List<HourlyUtilization> hourlyBreakdown;
}

package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyUtilization {
    private int hour;
    private double utilizationPct;
    private int bookingsCount;
}

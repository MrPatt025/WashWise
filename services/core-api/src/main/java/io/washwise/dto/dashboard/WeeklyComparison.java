package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyComparison {
    private long thisWeekRevenue;
    private long lastWeekRevenue;
    private double changePercent;
}

package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummary {
    private TodayStats today;
    private WeeklyComparison weeklyComparison;
    private MachineStatusOverview machineStatus;
    private List<RecentActivity> recentActivity;
    private Instant generatedAt;
}

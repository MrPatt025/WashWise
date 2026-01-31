package io.washwise.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalytics {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalRevenue;
    private long totalTransactions;
    private double averageTicketSize;
    private List<DailyRevenue> dailyRevenue;
    private Map<String, Long> revenueByPaymentMethod;
}

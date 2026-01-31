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
public class CustomerAnalytics {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalCustomers;
    private long newCustomers;
    private long activeCustomers;
    private List<TopCustomer> topCustomers;
}

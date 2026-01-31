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
public class TopCustomer {
    private UUID userId;
    private String name;
    private String email;
    private int bookingsCount;
    private long totalSpent;
}

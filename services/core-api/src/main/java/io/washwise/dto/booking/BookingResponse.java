package io.washwise.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for booking information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private UUID id;
    private String bookingNumber;
    
    private UUID machineId;
    private String machineLabel;
    
    private UUID userId;
    private String userName;
    
    private Instant startTime;
    private Instant endTime;
    private Instant actualStartTime;
    private Instant actualEndTime;
    
    private String status;
    private String paymentStatus;
    private BigDecimal amount;
    
    private String notes;
    private Instant createdAt;
}

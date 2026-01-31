package io.washwise.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for payment information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private UUID id;
    private String idempotencyKey;
    private UUID bookingId;
    
    private Integer amount;
    private String currency;
    private String method;
    private String status;
    
    private String provider;
    private String providerPaymentId;
    private String receiptNumber;
    
    private Instant confirmedAt;
    private Instant failedAt;
    private String failureCode;
    private String failureMessage;
    
    private Integer refundAmount;
    private Instant refundedAt;
    
    // For redirect/QR payments
    private String qrCodeUrl;
    private String redirectUrl;
    
    private Instant createdAt;
}

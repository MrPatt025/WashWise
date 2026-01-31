package io.washwise.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Internal DTO for payment provider response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentProviderResponse {

    private String providerPaymentId;
    private Map<String, Object> providerData;
    private String qrCodeUrl;
    private String redirectUrl;
}

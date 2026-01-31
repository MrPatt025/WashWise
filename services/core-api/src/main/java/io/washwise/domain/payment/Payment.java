package io.washwise.domain.payment;

import io.washwise.domain.booking.Booking;
import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Payment entity for tracking payment transactions.
 * Supports idempotency keys and multiple payment providers.
 */
@Entity
@Table(name = "payments",
    indexes = {
        @Index(name = "idx_payments_tenant", columnList = "tenant_id"),
        @Index(name = "idx_payments_user", columnList = "user_id"),
        @Index(name = "idx_payments_status", columnList = "status"),
        @Index(name = "idx_payments_provider", columnList = "provider, provider_payment_id"),
        @Index(name = "idx_payments_created", columnList = "created_at")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", unique = true)
    private Booking booking;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "THB";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 50)
    private String provider;

    @Column(name = "provider_payment_id", length = 255)
    private String providerPaymentId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "provider_data", columnDefinition = "jsonb")
    private Map<String, Object> providerData;

    @Column(name = "initiated_at")
    @Builder.Default
    private Instant initiatedAt = Instant.now();

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "failed_at")
    private Instant failedAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Column(name = "failure_message", columnDefinition = "text")
    private String failureMessage;

    @Column(name = "refund_amount")
    private Integer refundAmount;

    @Column(name = "refund_reason", columnDefinition = "text")
    private String refundReason;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "receipt_number", unique = true, length = 50)
    private String receiptNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = Map.of();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PaymentWebhookEvent> webhookEvents = new ArrayList<>();
}

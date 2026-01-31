package io.washwise.domain.booking;

import io.washwise.domain.machine.Machine;
import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Booking entity for machine reservations and usage tracking.
 */
@Entity
@Table(name = "bookings",
    indexes = {
        @Index(name = "idx_bookings_tenant", columnList = "tenant_id"),
        @Index(name = "idx_bookings_user", columnList = "user_id"),
        @Index(name = "idx_bookings_machine", columnList = "machine_id"),
        @Index(name = "idx_bookings_status", columnList = "status"),
        @Index(name = "idx_bookings_start_time", columnList = "start_time")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "booking_number", nullable = false, unique = true, length = 20)
    private String bookingNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "actual_start_time")
    private Instant actualStartTime;

    @Column(name = "actual_end_time")
    private Instant actualEndTime;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(columnDefinition = "text")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum BookingStatus {
        PENDING,        // Created, awaiting payment/confirmation
        CONFIRMED,      // Paid and confirmed
        IN_PROGRESS,    // Machine is running
        COMPLETED,      // Successfully completed
        CANCELLED,      // Cancelled by user or system
        NO_SHOW,        // User didn't show up
        REFUNDED        // Payment refunded
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED,
        PARTIALLY_REFUNDED
    }

    public enum PaymentMethod {
        CASH,
        CREDIT_CARD,
        DEBIT_CARD,
        PROMPTPAY,
        WALLET,
        LINE_PAY,
        TRUE_MONEY
    }

    /**
     * Confirm the booking after payment.
     */
    public void confirm(PaymentMethod method, String reference) {
        this.status = BookingStatus.CONFIRMED;
        this.paymentStatus = PaymentStatus.PAID;
        this.paymentMethod = method;
        this.paymentReference = reference;
        this.paidAt = Instant.now();
    }

    /**
     * Start the booking (machine begins cycle).
     */
    public void start() {
        if (this.status != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking must be confirmed before starting");
        }
        this.status = BookingStatus.IN_PROGRESS;
        this.actualStartTime = Instant.now();
    }

    /**
     * Complete the booking.
     */
    public void complete() {
        this.status = BookingStatus.COMPLETED;
        this.actualEndTime = Instant.now();
    }

    /**
     * Cancel the booking.
     */
    public void cancel(String reason) {
        this.status = BookingStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancellationReason = reason;
    }

    /**
     * Generate a unique booking number.
     */
    public static String generateBookingNumber() {
        return "BK" + System.currentTimeMillis() + String.format("%04d", (int)(Math.random() * 10000));
    }
}

package io.washwise.domain.stats;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Daily aggregated statistics per tenant.
 */
@Entity
@Table(name = "daily_tenant_stats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "date"}),
    indexes = {
        @Index(name = "idx_daily_tenant_stats_tenant", columnList = "tenant_id"),
        @Index(name = "idx_daily_tenant_stats_date", columnList = "date")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTenantStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "total_bookings")
    @Builder.Default
    private int totalBookings = 0;

    @Column(name = "completed_bookings")
    @Builder.Default
    private int completedBookings = 0;

    @Column(name = "cancelled_bookings")
    @Builder.Default
    private int cancelledBookings = 0;

    @Column(name = "no_show_bookings")
    @Builder.Default
    private int noShowBookings = 0;

    @Column(name = "total_revenue")
    @Builder.Default
    private long totalRevenue = 0;

    @Column(name = "avg_ticket_size")
    @Builder.Default
    private int avgTicketSize = 0;

    @Column(name = "machine_utilization")
    @Builder.Default
    private double machineUtilization = 0.0;

    @Column(name = "peak_hour")
    private Integer peakHour;

    @Column(name = "new_customers")
    @Builder.Default
    private int newCustomers = 0;

    @Column(name = "returning_customers")
    @Builder.Default
    private int returningCustomers = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

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
 * Daily aggregated statistics per branch.
 */
@Entity
@Table(name = "daily_branch_stats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"branch_id", "date"}),
    indexes = {
        @Index(name = "idx_daily_branch_stats_tenant", columnList = "tenant_id"),
        @Index(name = "idx_daily_branch_stats_branch", columnList = "branch_id"),
        @Index(name = "idx_daily_branch_stats_date", columnList = "date")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyBranchStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "total_bookings")
    @Builder.Default
    private int totalBookings = 0;

    @Column(name = "completed_bookings")
    @Builder.Default
    private int completedBookings = 0;

    @Column(name = "total_revenue")
    @Builder.Default
    private long totalRevenue = 0;

    @Column(name = "machine_utilization")
    @Builder.Default
    private double machineUtilization = 0.0;

    @Column(name = "washer_revenue")
    @Builder.Default
    private long washerRevenue = 0;

    @Column(name = "dryer_revenue")
    @Builder.Default
    private long dryerRevenue = 0;

    @Column(name = "washer_cycles")
    @Builder.Default
    private int washerCycles = 0;

    @Column(name = "dryer_cycles")
    @Builder.Default
    private int dryerCycles = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

package io.washwise.domain.machine;

import io.washwise.domain.tenant.Tenant;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Machine entity representing a washing/drying machine.
 */
@Entity
@Table(name = "machines",
    indexes = {
        @Index(name = "idx_machines_tenant", columnList = "tenant_id"),
        @Index(name = "idx_machines_status", columnList = "status"),
        @Index(name = "idx_machines_branch", columnList = "branch_id")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "machine_number", length = 20)
    private String machineNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MachineType type = MachineType.WASHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MachineStatus status = MachineStatus.IDLE;

    @Column(precision = 10, scale = 2)
    private BigDecimal pricePerCycle;

    @Column(name = "cycle_duration_minutes")
    @Builder.Default
    private Integer cycleDurationMinutes = 45;

    @Column(name = "capacity_kg", precision = 5, scale = 2)
    private BigDecimal capacityKg;

    @Column(length = 100)
    private String model;

    @Column(length = 100)
    private String manufacturer;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "iot_device_id", length = 100)
    private String iotDeviceId;

    @Column(name = "last_maintenance_at")
    private Instant lastMaintenanceAt;

    @Column(name = "total_cycles")
    @Builder.Default
    private Long totalCycles = 0L;

    @Column(name = "current_cycle_started_at")
    private Instant currentCycleStartedAt;

    @Column(name = "current_cycle_ends_at")
    private Instant currentCycleEndsAt;

    @Column(name = "error_code", length = 20)
    private String errorCode;

    @Column(name = "error_message")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum MachineType {
        WASHER,
        DRYER,
        COMBO
    }

    public enum MachineStatus {
        IDLE,           // Available for use
        IN_USE,         // Currently running
        RESERVED,       // Reserved for upcoming booking
        MAINTENANCE,    // Under maintenance
        ERROR,          // Has an error
        OFFLINE         // Not communicating
    }

    /**
     * Start a new cycle on this machine.
     */
    public void startCycle() {
        if (this.status != MachineStatus.IDLE && this.status != MachineStatus.RESERVED) {
            throw new IllegalStateException("Machine is not available for use");
        }
        this.status = MachineStatus.IN_USE;
        this.currentCycleStartedAt = Instant.now();
        this.currentCycleEndsAt = Instant.now().plusSeconds(cycleDurationMinutes * 60L);
        this.totalCycles++;
    }

    /**
     * Complete the current cycle.
     */
    public void completeCycle() {
        this.status = MachineStatus.IDLE;
        this.currentCycleStartedAt = null;
        this.currentCycleEndsAt = null;
        this.errorCode = null;
        this.errorMessage = null;
    }

    /**
     * Set machine to error state.
     */
    public void setError(String errorCode, String errorMessage) {
        this.status = MachineStatus.ERROR;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    /**
     * Calculate remaining time in seconds.
     */
    public Long getRemainingSeconds() {
        if (currentCycleEndsAt == null) return null;
        long remaining = currentCycleEndsAt.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    /**
     * Calculate progress percentage.
     */
    public Integer getProgressPercent() {
        if (currentCycleStartedAt == null || currentCycleEndsAt == null) return null;
        long totalDuration = currentCycleEndsAt.getEpochSecond() - currentCycleStartedAt.getEpochSecond();
        long elapsed = Instant.now().getEpochSecond() - currentCycleStartedAt.getEpochSecond();
        if (totalDuration <= 0) return 100;
        return (int) Math.min(100, (elapsed * 100) / totalDuration);
    }
}

package io.washwise.repository;

import io.washwise.domain.stats.DailyTenantStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyTenantStatsRepository extends JpaRepository<DailyTenantStats, UUID> {

    Optional<DailyTenantStats> findByTenantIdAndDate(UUID tenantId, LocalDate date);

    @Modifying
    @Query(value = """
        INSERT INTO daily_tenant_stats (
            id, tenant_id, date, total_bookings, completed_bookings, 
            cancelled_bookings, no_show_bookings, total_revenue, 
            avg_ticket_size, machine_utilization, peak_hour,
            new_customers, returning_customers, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), :tenantId, :date, :totalBookings, :completedBookings,
            :cancelledBookings, :noShowBookings, :totalRevenue,
            :avgTicketSize, :machineUtilization, :peakHour,
            :newCustomers, :returningCustomers, NOW(), NOW()
        )
        ON CONFLICT (tenant_id, date) DO UPDATE SET
            total_bookings = EXCLUDED.total_bookings,
            completed_bookings = EXCLUDED.completed_bookings,
            cancelled_bookings = EXCLUDED.cancelled_bookings,
            no_show_bookings = EXCLUDED.no_show_bookings,
            total_revenue = EXCLUDED.total_revenue,
            avg_ticket_size = EXCLUDED.avg_ticket_size,
            machine_utilization = EXCLUDED.machine_utilization,
            peak_hour = EXCLUDED.peak_hour,
            new_customers = EXCLUDED.new_customers,
            returning_customers = EXCLUDED.returning_customers,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertDailyStats(
        @Param("tenantId") UUID tenantId,
        @Param("date") LocalDate date,
        @Param("totalBookings") int totalBookings,
        @Param("completedBookings") int completedBookings,
        @Param("cancelledBookings") int cancelledBookings,
        @Param("noShowBookings") int noShowBookings,
        @Param("totalRevenue") long totalRevenue,
        @Param("avgTicketSize") int avgTicketSize,
        @Param("machineUtilization") double machineUtilization,
        @Param("peakHour") Integer peakHour,
        @Param("newCustomers") int newCustomers,
        @Param("returningCustomers") int returningCustomers
    );
}

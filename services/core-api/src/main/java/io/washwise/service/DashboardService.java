package io.washwise.service;

import io.washwise.domain.booking.BookingStatus;
import io.washwise.dto.dashboard.*;
import io.washwise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

/**
 * Service for dashboard analytics and reporting.
 * Provides aggregated statistics for tenants and branches.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DashboardService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;
    private final DailyTenantStatsRepository tenantStatsRepository;
    // Note: Branch stats repository available for future branch-level statistics
    // implementation
    @SuppressWarnings("unused")
    private final DailyBranchStatsRepository branchStatsRepository;

    private static final ZoneId TIMEZONE = ZoneId.of("Asia/Bangkok");

    /**
     * Get dashboard summary for a tenant.
     */
    @Transactional(readOnly = true)
    public DashboardSummary getDashboardSummary(UUID tenantId) {
        LocalDate today = LocalDate.now(TIMEZONE);
        Instant todayStart = today.atStartOfDay(TIMEZONE).toInstant();
        Instant todayEnd = today.plusDays(1).atStartOfDay(TIMEZONE).toInstant();
        
        // Today's stats
        TodayStats todayStats = getTodayStats(tenantId, todayStart, todayEnd);
        
        // This week's comparison
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        WeeklyComparison weeklyComparison = getWeeklyComparison(tenantId, weekStart);
        
        // Machine status overview
        MachineStatusOverview machineStatus = getMachineStatusOverview(tenantId);
        
        // Recent activity
        List<RecentActivity> recentActivity = getRecentActivity(tenantId, 10);
        
        return DashboardSummary.builder()
            .today(todayStats)
            .weeklyComparison(weeklyComparison)
            .machineStatus(machineStatus)
            .recentActivity(recentActivity)
            .generatedAt(Instant.now())
            .build();
    }

    /**
     * Get revenue analytics for a date range.
     */
    @Transactional(readOnly = true)
    public RevenueAnalytics getRevenueAnalytics(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(TIMEZONE).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(TIMEZONE).toInstant();
        
        // Get total revenue
        Long totalRevenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, start, end);
        
        // Get daily breakdown
        List<DailyRevenue> dailyRevenue = getDailyRevenue(tenantId, startDate, endDate);
        
        // Get revenue by payment method
        Map<String, Long> byPaymentMethod = getRevenueByPaymentMethod(tenantId, start, end);
        
        // Calculate average ticket size
        Long totalTransactions = bookingRepository.countCompletedByDateRange(tenantId, start, end);
        Double avgTicketSize = totalTransactions > 0 ? 
            (totalRevenue != null ? totalRevenue : 0L) / (double) totalTransactions : 0.0;
        
        return RevenueAnalytics.builder()
            .startDate(startDate)
            .endDate(endDate)
            .totalRevenue(totalRevenue != null ? totalRevenue : 0L)
            .totalTransactions(totalTransactions)
            .averageTicketSize(avgTicketSize)
            .dailyRevenue(dailyRevenue)
            .revenueByPaymentMethod(byPaymentMethod)
            .build();
    }

    /**
     * Get utilization analytics for machines.
     */
    @Transactional(readOnly = true)
    public UtilizationAnalytics getUtilizationAnalytics(UUID tenantId, LocalDate date) {
        // Calculate utilization per machine
        List<MachineUtilization> machineUtilization = getMachineUtilization(tenantId, date);
        
        // Hourly breakdown
        List<HourlyUtilization> hourlyBreakdown = getHourlyUtilization(tenantId, date);
        
        // Calculate overall utilization
        double overallUtilization = machineUtilization.stream()
            .mapToDouble(MachineUtilization::getUtilizationPct)
            .average()
            .orElse(0.0);
        
        // Find peak hours
        OptionalInt peakHour = hourlyBreakdown.stream()
            .max(Comparator.comparingDouble(HourlyUtilization::getUtilizationPct))
            .map(HourlyUtilization::getHour)
            .map(OptionalInt::of)
            .orElse(OptionalInt.empty());
        
        return UtilizationAnalytics.builder()
            .date(date)
            .overallUtilization(overallUtilization)
            .peakHour(peakHour.isPresent() ? peakHour.getAsInt() : null)
            .machineUtilization(machineUtilization)
            .hourlyBreakdown(hourlyBreakdown)
            .build();
    }

    /**
     * Get customer analytics.
     */
    @Transactional(readOnly = true)
    public CustomerAnalytics getCustomerAnalytics(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(TIMEZONE).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(TIMEZONE).toInstant();
        
        // Total customers
        long totalCustomers = userRepository.countCustomersByTenantId(tenantId);
        
        // New customers in period
        long newCustomers = userRepository.countNewCustomersByDateRange(tenantId, start, end);
        
        // Active customers (made a booking in period)
        long activeCustomers = bookingRepository.countDistinctUsersByDateRange(tenantId, start, end);
        
        // Top customers
        List<TopCustomer> topCustomers = getTopCustomers(tenantId, start, end, 10);
        
        return CustomerAnalytics.builder()
            .startDate(startDate)
            .endDate(endDate)
            .totalCustomers(totalCustomers)
            .newCustomers(newCustomers)
            .activeCustomers(activeCustomers)
            .topCustomers(topCustomers)
            .build();
    }

    /**
     * Update daily statistics (called by scheduled job).
     */
    @Transactional
    public void updateDailyStats(UUID tenantId, LocalDate date) {
        Instant dayStart = date.atStartOfDay(TIMEZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(TIMEZONE).toInstant();
        
        // Calculate tenant-level stats
        var stats = calculateDailyTenantStats(tenantId, dayStart, dayEnd);
        tenantStatsRepository.upsertDailyStats(
            tenantId, date,
            stats.totalBookings(), stats.completedBookings(), 
            stats.cancelledBookings(), stats.noShowBookings(),
            stats.totalRevenue(), stats.avgTicketSize(),
            stats.machineUtilization(), stats.peakHour(),
            stats.newCustomers(), stats.returningCustomers()
        );
        
        log.info("Updated daily stats for tenant {} on {}", tenantId, date);
    }

    // ==================== Private Helper Methods ====================

    private TodayStats getTodayStats(UUID tenantId, Instant start, Instant end) {
        long bookingCount = bookingRepository.countByTenantIdAndDateRange(tenantId, start, end);
        Long revenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, start, end);
        long activeBookings = bookingRepository.countByTenantIdAndStatusIn(
            tenantId, List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN));
        
        return TodayStats.builder()
            .bookings((int) bookingCount)
            .revenue(revenue != null ? revenue : 0L)
            .activeBookings((int) activeBookings)
            .build();
    }

    private WeeklyComparison getWeeklyComparison(UUID tenantId, LocalDate weekStart) {
        LocalDate prevWeekStart = weekStart.minusWeeks(1);
        
        Instant thisWeekStart = weekStart.atStartOfDay(TIMEZONE).toInstant();
        Instant thisWeekEnd = weekStart.plusWeeks(1).atStartOfDay(TIMEZONE).toInstant();
        Instant prevWeekStartInstant = prevWeekStart.atStartOfDay(TIMEZONE).toInstant();
        Instant prevWeekEnd = weekStart.atStartOfDay(TIMEZONE).toInstant();
        
        Long thisWeekRevenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, thisWeekStart, thisWeekEnd);
        Long prevWeekRevenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, prevWeekStartInstant, prevWeekEnd);
        
        thisWeekRevenue = thisWeekRevenue != null ? thisWeekRevenue : 0L;
        prevWeekRevenue = prevWeekRevenue != null ? prevWeekRevenue : 0L;
        
        double changePercent = prevWeekRevenue > 0 
            ? ((thisWeekRevenue - prevWeekRevenue) / (double) prevWeekRevenue) * 100 
            : 0;
        
        return WeeklyComparison.builder()
            .thisWeekRevenue(thisWeekRevenue)
            .lastWeekRevenue(prevWeekRevenue)
            .changePercent(changePercent)
            .build();
    }

    private MachineStatusOverview getMachineStatusOverview(UUID tenantId) {
        Map<String, Long> statusCounts = machineRepository.countByTenantIdGroupByStatus(tenantId);
        
        return MachineStatusOverview.builder()
            .available(statusCounts.getOrDefault("AVAILABLE", 0L).intValue())
            .busy(statusCounts.getOrDefault("BUSY", 0L).intValue())
            .offline(statusCounts.getOrDefault("OFFLINE", 0L).intValue())
            .maintenance(statusCounts.getOrDefault("MAINTENANCE", 0L).intValue())
            .error(statusCounts.getOrDefault("ERROR", 0L).intValue())
            .build();
    }

    private List<RecentActivity> getRecentActivity(UUID tenantId, int limit) {
        // This would combine recent bookings, payments, and machine events
        // For now, return empty list - implement with actual queries
        return List.of();
    }

    private List<DailyRevenue> getDailyRevenue(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        List<DailyRevenue> result = new ArrayList<>();
        LocalDate current = startDate;
        
        while (!current.isAfter(endDate)) {
            Instant dayStart = current.atStartOfDay(TIMEZONE).toInstant();
            Instant dayEnd = current.plusDays(1).atStartOfDay(TIMEZONE).toInstant();
            
            Long revenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, dayStart, dayEnd);
            
            result.add(DailyRevenue.builder()
                .date(current)
                .revenue(revenue != null ? revenue : 0L)
                .build());
            
            current = current.plusDays(1);
        }
        
        return result;
    }

    private Map<String, Long> getRevenueByPaymentMethod(UUID tenantId, Instant start, Instant end) {
        // Would use a GROUP BY query on payment method
        return Map.of();
    }

    private List<MachineUtilization> getMachineUtilization(UUID tenantId, LocalDate date) {
        // Calculate utilization per machine based on booking hours
        return List.of();
    }

    private List<HourlyUtilization> getHourlyUtilization(UUID tenantId, LocalDate date) {
        // Calculate utilization per hour
        return List.of();
    }

    private List<TopCustomer> getTopCustomers(UUID tenantId, Instant start, Instant end, int limit) {
        // Get top customers by booking count or revenue
        return List.of();
    }

    private DailyStatsRecord calculateDailyTenantStats(UUID tenantId, Instant dayStart, Instant dayEnd) {
        long totalBookings = bookingRepository.countByTenantIdAndDateRange(tenantId, dayStart, dayEnd);
        long completedBookings = bookingRepository.countByTenantIdAndStatusAndDateRange(
            tenantId, BookingStatus.COMPLETED, dayStart, dayEnd);
        long cancelledBookings = bookingRepository.countByTenantIdAndStatusAndDateRange(
            tenantId, BookingStatus.CANCELLED, dayStart, dayEnd);
        long noShowBookings = bookingRepository.countByTenantIdAndStatusAndDateRange(
            tenantId, BookingStatus.NO_SHOW, dayStart, dayEnd);
        
        Long totalRevenue = paymentRepository.sumCompletedPaymentsByDateRange(tenantId, dayStart, dayEnd);
        totalRevenue = totalRevenue != null ? totalRevenue : 0L;
        
        int avgTicketSize = completedBookings > 0 ? (int) (totalRevenue / completedBookings) : 0;
        
        return new DailyStatsRecord(
            (int) totalBookings, (int) completedBookings, 
            (int) cancelledBookings, (int) noShowBookings,
            totalRevenue, avgTicketSize,
            0.0, null, 0, 0
        );
    }

    private record DailyStatsRecord(
        int totalBookings, int completedBookings, int cancelledBookings, int noShowBookings,
        long totalRevenue, int avgTicketSize,
        double machineUtilization, Integer peakHour,
        int newCustomers, int returningCustomers
    ) {}
}

package io.washwise.controller;

import io.washwise.dto.dashboard.*;
import io.washwise.security.TenantContext;
import io.washwise.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * REST controller for dashboard and analytics.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Analytics and reporting APIs")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('OWNER', 'SUPER_ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary", description = "Overview of today's stats, weekly comparison, and machine status")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        DashboardSummary summary = dashboardService.getDashboardSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get revenue analytics", description = "Revenue breakdown for a date range")
    public ResponseEntity<RevenueAnalytics> getRevenueAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        RevenueAnalytics analytics = dashboardService.getRevenueAnalytics(tenantId, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/utilization")
    @Operation(summary = "Get utilization analytics", description = "Machine utilization for a specific date")
    public ResponseEntity<UtilizationAnalytics> getUtilizationAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        UtilizationAnalytics analytics = dashboardService.getUtilizationAnalytics(tenantId, date);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/customers")
    @Operation(summary = "Get customer analytics", description = "Customer metrics for a date range")
    public ResponseEntity<CustomerAnalytics> getCustomerAnalytics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        CustomerAnalytics analytics = dashboardService.getCustomerAnalytics(tenantId, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }
}

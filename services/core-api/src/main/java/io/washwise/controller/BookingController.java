package io.washwise.controller;

import io.washwise.dto.booking.*;
import io.washwise.security.TenantContext;
import io.washwise.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for booking management.
 * Provides endpoints for creating, managing, and querying bookings.
 */
@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Booking management APIs")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create a new booking", description = "Book a machine for a specific time slot")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateBookingRequest request) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse response = bookingService.createBooking(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all bookings", description = "List all bookings for the current tenant")
    public ResponseEntity<Page<BookingResponse>> getBookings(
            @PageableDefault(size = 20) Pageable pageable) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        Page<BookingResponse> bookings = bookingService.getBookings(tenantId, pageable);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking by ID")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable UUID id) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse booking = bookingService.getBooking(tenantId, id);
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/my")
    @Operation(summary = "Get my bookings", description = "List all bookings for the current user")
    public ResponseEntity<Page<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<BookingResponse> bookings = bookingService.getUserBookings(userId, pageable);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/machine/{machineId}/slots")
    @Operation(summary = "Get available slots", description = "Get available time slots for a machine on a specific date")
    public ResponseEntity<List<TimeSlotResponse>> getAvailableSlots(
            @PathVariable UUID machineId,
            @Parameter(description = "Date in YYYY-MM-DD format")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        List<TimeSlotResponse> slots = bookingService.getAvailableSlots(tenantId, machineId, date);
        return ResponseEntity.ok(slots);
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm booking", description = "Confirm a pending booking after payment")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable UUID id,
            @RequestParam String paymentReference) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse response = bookingService.confirmBooking(tenantId, id, paymentReference);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/check-in")
    @Operation(summary = "Check in", description = "Check in for a confirmed booking")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable UUID id) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse response = bookingService.checkIn(tenantId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete booking", description = "Mark a booking as completed")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable UUID id) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse response = bookingService.completeBooking(tenantId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel booking")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        
        UUID tenantId = TenantContext.getCurrentTenantId();
        BookingResponse response = bookingService.cancelBooking(tenantId, id, reason);
        return ResponseEntity.ok(response);
    }
}

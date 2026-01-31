package io.washwise.service;

import io.washwise.domain.booking.Booking;
import io.washwise.domain.booking.BookingStatus;
import io.washwise.domain.booking.PaymentStatus;
import io.washwise.domain.machine.Machine;
import io.washwise.domain.machine.MachineStatus;
import io.washwise.domain.user.User;
import io.washwise.dto.booking.*;
import io.washwise.exception.BusinessException;
import io.washwise.exception.ConflictException;
import io.washwise.exception.NotFoundException;
import io.washwise.repository.BookingRepository;
import io.washwise.repository.MachineRepository;
import io.washwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service for managing bookings with comprehensive overlap protection.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final MachineRepository machineRepository;
    private final UserRepository userRepository;

    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN);

    private static final int MAX_BOOKING_DURATION_MINS = 180;
    private static final int MAX_ADVANCE_BOOKING_DAYS = 14;
    private static final int NO_SHOW_GRACE_PERIOD_MINS = 30;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(retryFor = { DataIntegrityViolationException.class,
            ConflictException.class }, maxAttempts = 3, backoff = @Backoff(delay = 100, multiplier = 2))
    public BookingResponse createBooking(UUID tenantId, UUID userId, CreateBookingRequest request) {
        log.info("Creating booking for user {} on machine {}", userId, request.getMachineId());

        Machine machine = machineRepository.findByIdAndTenantId(request.getMachineId(), tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        if (!machine.isActive()) {
            throw new BusinessException("Machine is not active");
        }

        if (machine.getStatus() == MachineStatus.MAINTENANCE ||
                machine.getStatus() == MachineStatus.OFFLINE) {
            throw new BusinessException("Machine is currently unavailable: " + machine.getStatus());
        }

        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Instant startTime = request.getStartTime();
        Instant endTime = request.getEndTime();

        validateTimeSlot(startTime, endTime);

        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                machine.getId(), startTime, endTime, BLOCKING_STATUSES);

        if (!overlapping.isEmpty()) {
            log.warn("Overlap detected for machine {} at {}-{}", machine.getId(), startTime, endTime);
            throw new ConflictException("Time slot is already booked");
        }

        BigDecimal price = calculatePrice(machine, startTime, endTime);
        String bookingNumber = generateBookingNumber(tenantId);

        Booking booking = Booking.builder()
                .tenant(machine.getTenant())
                .user(user)
                .machine(machine)
                .bookingNumber(bookingNumber)
                .startTime(startTime)
                .endTime(endTime)
                .amount(price)
                .status(BookingStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .notes(request.getNotes())
                .build();

        try {
            Booking saved = bookingRepository.save(booking);
            log.info("Booking {} created successfully", saved.getBookingNumber());
            return mapToResponse(saved);
        } catch (DataIntegrityViolationException e) {
            log.warn("Database constraint prevented overlapping booking", e);
            throw new ConflictException("Time slot is no longer available");
        }
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookings(UUID tenantId, Pageable pageable) {
        return bookingRepository.findAllByTenantId(tenantId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(UUID tenantId, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
        return bookingRepository.findByUserId(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public BookingResponse confirmBooking(UUID tenantId, UUID bookingId, String paymentReference) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BusinessException("Only pending bookings can be confirmed");
        }

        if (booking.getStartTime().isBefore(Instant.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            throw new BusinessException("Booking has expired");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setPaymentReference(paymentReference);
        booking.setPaidAt(Instant.now());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} confirmed with payment {}", booking.getBookingNumber(), paymentReference);

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse checkIn(UUID tenantId, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed bookings can be checked in");
        }

        Instant now = Instant.now();
        Instant earliestCheckIn = booking.getStartTime().minus(Duration.ofMinutes(15));
        if (now.isBefore(earliestCheckIn)) {
            throw new BusinessException("Too early to check in");
        }

        if (now.isAfter(booking.getEndTime().plus(Duration.ofMinutes(NO_SHOW_GRACE_PERIOD_MINS)))) {
            booking.setStatus(BookingStatus.NO_SHOW);
            bookingRepository.save(booking);
            throw new BusinessException("Booking window has passed");
        }

        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setActualStartTime(now);

        Machine machine = booking.getMachine();
        machine.setStatus(MachineStatus.RUNNING);
        machineRepository.save(machine);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} checked in", booking.getBookingNumber());

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse completeBooking(UUID tenantId, UUID bookingId) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException("Only checked-in bookings can be completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualEndTime(Instant.now());

        Machine machine = booking.getMachine();
        machine.setStatus(MachineStatus.IDLE);
        machine.setTotalCycles(machine.getTotalCycles() + 1);
        machineRepository.save(machine);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} completed", booking.getBookingNumber());

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(UUID tenantId, UUID bookingId, String reason) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessException("Cannot cancel a completed or already cancelled booking");
        }

        if (booking.getStatus() == BookingStatus.CHECKED_IN) {
            Machine machine = booking.getMachine();
            machine.setStatus(MachineStatus.IDLE);
            machineRepository.save(machine);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());
        booking.setCancellationReason(reason);

        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} cancelled: {}", booking.getBookingNumber(), reason);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getAvailableSlots(UUID tenantId, UUID machineId, LocalDate date) {
        Machine machine = machineRepository.findByIdAndTenantId(machineId, tenantId)
                .orElseThrow(() -> new NotFoundException("Machine not found"));

        ZoneId zone = ZoneId.of("Asia/Bangkok");
        Instant dayStart = date.atStartOfDay(zone).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant();

        List<Booking> existingBookings = bookingRepository.findOverlappingBookings(
                machineId, dayStart, dayEnd, BLOCKING_STATUSES);

        List<TimeSlotResponse> slots = new ArrayList<>();
        int slotDuration = machine.getCycleDurationMinutes() != null ? machine.getCycleDurationMinutes() : 45;

        Instant slotStart = date.atTime(6, 0).atZone(zone).toInstant();
        Instant operatingEnd = date.atTime(22, 0).atZone(zone).toInstant();

        while (slotStart.isBefore(operatingEnd)) {
            Instant slotEnd = slotStart.plus(Duration.ofMinutes(slotDuration));

            if (slotEnd.isAfter(operatingEnd)) {
                break;
            }

            boolean isPast = slotStart.isBefore(Instant.now());

            final Instant finalSlotStart = slotStart;
            final Instant finalSlotEnd = slotEnd;
            boolean isBooked = existingBookings.stream()
                    .anyMatch(b -> isOverlapping(b.getStartTime(), b.getEndTime(), finalSlotStart, finalSlotEnd));

            slots.add(TimeSlotResponse.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .available(!isPast && !isBooked)
                    .price(machine.getPricePerCycle())
                    .build());

            slotStart = slotEnd;
        }

        return slots;
    }

    private void validateTimeSlot(Instant startTime, Instant endTime) {
        Instant now = Instant.now();

        if (startTime.isBefore(now)) {
            throw new BusinessException("Cannot book a time slot in the past");
        }

        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new BusinessException("End time must be after start time");
        }

        Duration duration = Duration.between(startTime, endTime);
        if (duration.toMinutes() > MAX_BOOKING_DURATION_MINS) {
            throw new BusinessException("Booking duration cannot exceed " + MAX_BOOKING_DURATION_MINS + " minutes");
        }

        Instant maxAdvance = now.plus(Duration.ofDays(MAX_ADVANCE_BOOKING_DAYS));
        if (startTime.isAfter(maxAdvance)) {
            throw new BusinessException("Cannot book more than " + MAX_ADVANCE_BOOKING_DAYS + " days in advance");
        }
    }

    private BigDecimal calculatePrice(Machine machine, Instant startTime, Instant endTime) {
        BigDecimal pricePerCycle = machine.getPricePerCycle();
        if (pricePerCycle == null) {
            return BigDecimal.ZERO;
        }
        return pricePerCycle;
    }

    private String generateBookingNumber(UUID tenantId) {
        String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd")
                .format(LocalDate.now());
        int random = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "BK" + dateStr + random;
    }

    private boolean isOverlapping(Instant start1, Instant end1, Instant start2, Instant end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .bookingNumber(booking.getBookingNumber())
                .machineId(booking.getMachine().getId())
                .machineLabel(booking.getMachine().getName())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getFullName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .actualStartTime(booking.getActualStartTime())
                .actualEndTime(booking.getActualEndTime())
                .status(booking.getStatus().name())
                .paymentStatus(booking.getPaymentStatus().name())
                .amount(booking.getAmount())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}

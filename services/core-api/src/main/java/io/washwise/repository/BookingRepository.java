package io.washwise.repository;

import io.washwise.domain.booking.Booking;
import io.washwise.domain.booking.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Query("SELECT b FROM Booking b WHERE b.tenant.id = :tenantId ORDER BY b.createdAt DESC")
    Page<Booking> findAllByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.tenant.id = :tenantId")
    Optional<Booking> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    Optional<Booking> findByBookingNumber(String bookingNumber);
    
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    Page<Booking> findByUserId(@Param("userId") UUID userId, Pageable pageable);
    
    @Query("SELECT b FROM Booking b WHERE b.machine.id = :machineId AND b.status IN :statuses AND " +
           "((b.startTime <= :endTime AND b.endTime >= :startTime) OR " +
           "(b.startTime >= :startTime AND b.startTime < :endTime))")
    List<Booking> findOverlappingBookings(
        @Param("machineId") UUID machineId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("statuses") List<BookingStatus> statuses
    );
    
    @Query("SELECT b FROM Booking b WHERE b.tenant.id = :tenantId AND b.status = :status")
    List<Booking> findByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.tenant.id = :tenantId AND b.startTime BETWEEN :start AND :end")
    List<Booking> findByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );
    
    @Query("SELECT SUM(b.amount) FROM Booking b WHERE b.tenant.id = :tenantId AND b.paymentStatus = 'PAID' AND b.paidAt BETWEEN :start AND :end")
    java.math.BigDecimal calculateRevenueByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tenant.id = :tenantId AND b.status = :status AND b.createdAt BETWEEN :start AND :end")
    long countByTenantIdAndStatusAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("status") BookingStatus status,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tenant.id = :tenantId AND b.createdAt BETWEEN :start AND :end")
    long countByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tenant.id = :tenantId AND b.status IN :statuses")
    long countByTenantIdAndStatusIn(
        @Param("tenantId") UUID tenantId,
        @Param("statuses") List<BookingStatus> statuses
    );

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tenant.id = :tenantId AND b.status = 'COMPLETED' AND b.createdAt BETWEEN :start AND :end")
    long countCompletedByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    @Query("SELECT COUNT(DISTINCT b.user.id) FROM Booking b WHERE b.tenant.id = :tenantId AND b.createdAt BETWEEN :start AND :end")
    long countDistinctUsersByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );
}

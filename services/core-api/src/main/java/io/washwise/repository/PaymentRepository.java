package io.washwise.repository;

import io.washwise.domain.payment.Payment;
import io.washwise.domain.payment.PaymentStatus;
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
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT p FROM Payment p WHERE p.id = :id AND p.tenant.id = :tenantId")
    Optional<Payment> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM Payment p WHERE p.tenant.id = :tenantId ORDER BY p.createdAt DESC")
    Page<Payment> findAllByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    Optional<Payment> findByBookingId(UUID bookingId);

    @Query("SELECT p FROM Payment p WHERE p.provider = :provider AND p.providerPaymentId = :providerPaymentId")
    Optional<Payment> findByProviderAndProviderPaymentId(
        @Param("provider") String provider,
        @Param("providerPaymentId") String providerPaymentId);

    @Query("SELECT p FROM Payment p WHERE p.tenant.id = :tenantId AND p.status = :status")
    List<Payment> findByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE p.tenant.id = :tenantId AND p.status = 'COMPLETED' " +
           "AND p.confirmedAt BETWEEN :start AND :end")
    List<Payment> findCompletedPaymentsByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tenant.id = :tenantId AND p.status = 'COMPLETED' " +
           "AND p.confirmedAt BETWEEN :start AND :end")
    Long sumCompletedPaymentsByDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end);
}

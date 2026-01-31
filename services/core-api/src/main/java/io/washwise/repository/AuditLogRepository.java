package io.washwise.repository;

import io.washwise.domain.audit.AuditAction;
import io.washwise.domain.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.tenant.id = :tenantId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenant.id = :tenantId AND a.entityType = :entityType " +
           "AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndEntityTypeAndEntityId(
        @Param("tenantId") UUID tenantId,
        @Param("entityType") String entityType,
        @Param("entityId") String entityId,
        Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenant.id = :tenantId AND a.user.id = :userId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndUserIdOrderByCreatedAtDesc(
        @Param("tenantId") UUID tenantId,
        @Param("userId") UUID userId,
        Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenant.id = :tenantId AND a.action = :action ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndAction(
        @Param("tenantId") UUID tenantId,
        @Param("action") AuditAction action,
        Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenant.id = :tenantId " +
           "AND a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
    Page<AuditLog> findByTenantIdAndDateRange(
        @Param("tenantId") UUID tenantId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        Pageable pageable);
}

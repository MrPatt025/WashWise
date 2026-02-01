package io.washwise.service;

import io.washwise.domain.audit.AuditAction;
import io.washwise.domain.audit.AuditLog;
import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.user.User;
import io.washwise.dto.audit.AuditLogResponse;
import io.washwise.repository.AuditLogRepository;
import io.washwise.repository.TenantRepository;
import io.washwise.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Service for audit logging.
 * Records all significant changes and actions in the system.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    /**
     * Log an audit event asynchronously.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAsync(UUID tenantId, UUID userId, AuditAction action,
            String entityType, String entityId,
            Map<String, Object> oldValues, Map<String, Object> newValues) {
        log(tenantId, userId, action, entityType, entityId, oldValues, newValues, null);
    }

    /**
     * Log an audit event synchronously.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID tenantId, UUID userId, AuditAction action,
            String entityType, String entityId,
            Map<String, Object> oldValues, Map<String, Object> newValues,
            Map<String, Object> metadata) {
        try {
            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
            if (tenant == null) {
                log.warn("Cannot log audit: tenant {} not found", tenantId);
                return;
            }

            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

            // Get request context
            String ipAddress = null;
            String userAgent = null;
            String requestId = null;

            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = getClientIp(request);
                userAgent = request.getHeader("User-Agent");
                requestId = request.getHeader("X-Request-ID");
            }

            AuditLog auditLog = AuditLog.builder()
                    .tenant(tenant)
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .requestId(requestId)
                    .metadata(metadata != null ? metadata : Map.of())
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit logged: {} {} {} by user {}", action, entityType, entityId, userId);

        } catch (Exception e) {
            log.error("Failed to log audit event", e);
        }
    }

    // ==================== Convenience Methods ====================

    public void logCreate(UUID tenantId, UUID userId, String entityType, String entityId, Object entity) {
        Map<String, Object> newValues = convertToMap(entity);
        logAsync(tenantId, userId, AuditAction.CREATE, entityType, entityId, null, newValues);
    }

    public void logUpdate(UUID tenantId, UUID userId, String entityType, String entityId,
            Object oldEntity, Object newEntity) {
        Map<String, Object> oldValues = convertToMap(oldEntity);
        Map<String, Object> newValues = convertToMap(newEntity);
        logAsync(tenantId, userId, AuditAction.UPDATE, entityType, entityId, oldValues, newValues);
    }

    public void logDelete(UUID tenantId, UUID userId, String entityType, String entityId, Object entity) {
        Map<String, Object> oldValues = convertToMap(entity);
        logAsync(tenantId, userId, AuditAction.DELETE, entityType, entityId, oldValues, null);
    }

    public void logLogin(UUID tenantId, UUID userId, boolean success) {
        log(tenantId, userId, AuditAction.LOGIN, "User", userId != null ? userId.toString() : null,
                null, Map.of("success", success), null);
    }

    public void logLogout(UUID tenantId, UUID userId) {
        log(tenantId, userId, AuditAction.LOGOUT, "User", userId.toString(), null, null, null);
    }

    public void logPasswordChange(UUID tenantId, UUID userId) {
        log(tenantId, userId, AuditAction.PASSWORD_CHANGE, "User", userId.toString(), null, null, null);
    }

    public void logRoleChange(UUID tenantId, UUID userId, UUID targetUserId, String oldRole, String newRole) {
        log(tenantId, userId, AuditAction.ROLE_CHANGE, "User", targetUserId.toString(),
                Map.of("role", oldRole), Map.of("role", newRole), null);
    }

    public void logBooking(UUID tenantId, UUID userId, String bookingId, String action) {
        log(tenantId, userId, AuditAction.BOOKING, "Booking", bookingId,
                null, Map.of("action", action), null);
    }

    public void logPayment(UUID tenantId, UUID userId, String paymentId, String status, Integer amount) {
        log(tenantId, userId, AuditAction.PAYMENT, "Payment", paymentId,
                null, Map.of("status", status, "amount", amount), null);
    }

    public void logMachineStatusChange(UUID tenantId, UUID userId, String machineId,
            String oldStatus, String newStatus) {
        log(tenantId, userId, AuditAction.MACHINE_STATUS_CHANGE, "Machine", machineId,
                Map.of("status", oldStatus), Map.of("status", newStatus), null);
    }

    // ==================== Query Methods ====================

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(UUID tenantId, Pageable pageable) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByEntity(UUID tenantId, String entityType,
            String entityId, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndEntityTypeAndEntityId(
                tenantId, entityType, entityId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByUser(UUID tenantId, UUID userId, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByAction(UUID tenantId, AuditAction action, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndAction(tenantId, action, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsByDateRange(UUID tenantId, Instant start,
            Instant end, Pageable pageable) {
        return auditLogRepository.findByTenantIdAndDateRange(tenantId, start, end, pageable)
                .map(this::mapToResponse);
    }

    // ==================== Private Helpers ====================

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertToMap(Object entity) {
        if (entity == null)
            return null;
        if (entity instanceof Map)
            return (Map<String, Object>) entity;

        // In production, use Jackson ObjectMapper to convert entity to map
        // This is a simplified version
        return Map.of("entity", entity.toString());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .action(log.getAction().name())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldValues(log.getOldValues())
                .newValues(log.getNewValues())
                .ipAddress(log.getIpAddress())
                .requestId(log.getRequestId())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

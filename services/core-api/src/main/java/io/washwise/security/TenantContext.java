package io.washwise.security;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.Optional;
import java.util.UUID;

/**
 * Request-scoped component to hold tenant context for the current request.
 * This allows services to access tenant information without passing it explicitly.
 */
@Component
@RequestScope
public class TenantContext {

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    private UUID tenantId;
    private UUID userId;
    private UUID branchId;
    private String userRole;
    private String clientIp;
    private String userAgent;
    private String requestId;

    /**
     * Get the current tenant ID (static convenience method).
     */
    public static UUID getCurrentTenantId() {
        TenantContext ctx = CONTEXT.get();
        return ctx != null ? ctx.getTenantId() : null;
    }

    /**
     * Get the current user ID (static convenience method).
     */
    public static UUID getCurrentUserId() {
        TenantContext ctx = CONTEXT.get();
        return ctx != null ? ctx.getUserId() : null;
    }

    /**
     * Set the current context for this thread.
     */
    public static void setCurrentContext(TenantContext context) {
        CONTEXT.set(context);
    }

    /**
     * Clear the current context for this thread.
     */
    public static void clearCurrentContext() {
        CONTEXT.remove();
    }

    /**
     * Get the current tenant ID.
     */
    public UUID getTenantId() {
        return tenantId;
    }

    /**
     * Set the current tenant ID.
     */
    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Get the current user ID.
     */
    public UUID getUserId() {
        return userId;
    }

    /**
     * Set the current user ID.
     */
    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    /**
     * Get the current branch ID (optional).
     */
    public Optional<UUID> getBranchId() {
        return Optional.ofNullable(branchId);
    }

    /**
     * Set the current branch ID.
     */
    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    /**
     * Get the current user's role.
     */
    public String getUserRole() {
        return userRole;
    }

    /**
     * Set the current user's role.
     */
    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    /**
     * Get the client IP address.
     */
    public String getClientIp() {
        return clientIp;
    }

    /**
     * Set the client IP address.
     */
    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    /**
     * Get the user agent string.
     */
    public String getUserAgent() {
        return userAgent;
    }

    /**
     * Set the user agent string.
     */
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    /**
     * Get the request ID for tracing.
     */
    public String getRequestId() {
        return requestId;
    }

    /**
     * Set the request ID for tracing.
     */
    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    /**
     * Check if tenant context is initialized.
     */
    public boolean isInitialized() {
        return tenantId != null && userId != null;
    }

    /**
     * Clear all context data.
     */
    public void clear() {
        this.tenantId = null;
        this.userId = null;
        this.branchId = null;
        this.userRole = null;
        this.clientIp = null;
        this.userAgent = null;
        this.requestId = null;
    }

    @Override
    public String toString() {
        return "TenantContext{" +
                "tenantId=" + tenantId +
                ", userId=" + userId +
                ", branchId=" + branchId +
                ", userRole='" + userRole + '\'' +
                ", requestId='" + requestId + '\'' +
                '}';
    }
}

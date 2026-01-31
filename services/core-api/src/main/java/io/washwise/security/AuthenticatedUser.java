package io.washwise.security;

import io.washwise.domain.user.UserRole;

import java.util.UUID;

/**
 * Record representing an authenticated user with tenant context.
 */
public record AuthenticatedUser(
        UUID userId,
        UUID tenantId,
        UserRole role
) {
    public boolean isOwner() {
        return role == UserRole.OWNER;
    }

    public boolean isManager() {
        return role == UserRole.MANAGER || role == UserRole.OWNER;
    }

    public boolean isStaff() {
        return role == UserRole.STAFF || isManager();
    }
}

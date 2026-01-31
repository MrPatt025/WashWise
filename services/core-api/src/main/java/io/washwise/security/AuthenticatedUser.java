package io.washwise.security;

import io.washwise.domain.user.User;

import java.util.UUID;

/**
 * Record representing an authenticated user with tenant context.
 */
public record AuthenticatedUser(
        UUID userId,
        UUID tenantId,
        User.UserRole role
) {
    public boolean isOwner() {
        return role == User.UserRole.OWNER;
    }

    public boolean isManager() {
        return role == User.UserRole.MANAGER || role == User.UserRole.OWNER;
    }

    public boolean isStaff() {
        return role == User.UserRole.STAFF || isManager();
    }
}

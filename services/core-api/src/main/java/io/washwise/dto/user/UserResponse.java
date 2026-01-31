package io.washwise.dto.user;

import io.washwise.domain.user.User;
import io.washwise.domain.user.UserRole;
import io.washwise.domain.user.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String fullName,
                UserRole role,
                UserStatus status,
        String phone,
        String avatarUrl,
        boolean emailVerified,
        Instant lastLoginAt,
        TenantInfo tenant,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.isEmailVerified(),
                user.getLastLoginAt(),
                new TenantInfo(
                        user.getTenant().getId(),
                        user.getTenant().getName(),
                        user.getTenant().getSlug()
                ),
                user.getCreatedAt()
        );
    }

    public record TenantInfo(UUID id, String name, String slug) {}
}

package io.washwise.dto.auth;

import io.washwise.dto.user.UserResponse;

public record AuthResponse(
        String accessToken,
        UserResponse user
) {}

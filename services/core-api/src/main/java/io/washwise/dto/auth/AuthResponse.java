package io.washwise.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.washwise.dto.user.UserResponse;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String accessToken,
                String refreshToken,
        UserResponse user
) {
        /**
         * Create response without refresh token (for responses where cookie is used)
         */
        public static AuthResponse withoutRefreshToken(String accessToken, UserResponse user) {
                return new AuthResponse(accessToken, null, user);
        }
}

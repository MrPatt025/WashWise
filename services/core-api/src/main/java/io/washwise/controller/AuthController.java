package io.washwise.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.washwise.dto.auth.AuthResponse;
import io.washwise.dto.auth.LoginRequest;
import io.washwise.dto.auth.RegisterRequest;
import io.washwise.dto.user.UserResponse;
import io.washwise.security.AuthenticatedUser;
import io.washwise.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "User authentication and registration")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    private final AuthService authService;

    /**
     * Set refresh token as HttpOnly cookie
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        // Note: SameSite=Lax is default in modern browsers, which works for same-site
        // requests
        response.addCookie(cookie);
    }

    @Operation(summary = "Register new tenant and owner")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        
        AuthResponse authResponse = authService.register(
                request,
                httpRequest.getHeader("User-Agent"),
                getClientIp(httpRequest)
        );
        
        // Set refresh token as HttpOnly cookie for security
        if (authResponse.refreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.refreshToken());
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @Operation(summary = "Login with email and password")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        
        AuthResponse authResponse = authService.login(
                request,
                httpRequest.getHeader("User-Agent"),
                getClientIp(httpRequest)
        );
        
        // Set refresh token as HttpOnly cookie for security
        if (authResponse.refreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.refreshToken());
        }

        return ResponseEntity.ok(authResponse);
    }

    @Operation(summary = "Refresh access token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest bodyToken,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        
        // Accept refresh token from cookie or body
        String refreshToken = cookieToken != null ? cookieToken : 
                (bodyToken != null ? bodyToken.refreshToken() : null);
        
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        AuthResponse authResponse = authService.refreshToken(
                refreshToken,
                httpRequest.getHeader("User-Agent"),
                getClientIp(httpRequest)
        );
        
        // Set new rotated refresh token as HttpOnly cookie
        if (authResponse.refreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.refreshToken());
        }

        return ResponseEntity.ok(authResponse);
    }

    @Operation(summary = "Logout (revoke refresh token)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest bodyToken,
            HttpServletResponse response) {
        
        String refreshToken = cookieToken != null ? cookieToken : 
                (bodyToken != null ? bodyToken.refreshToken() : null);
        
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        
        // Clear cookie
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Logout from all devices")
    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal AuthenticatedUser user) {
        authService.logoutAll(user.userId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal AuthenticatedUser user) {
        UserResponse profile = authService.getCurrentUser(user.userId(), user.tenantId());
        return ResponseEntity.ok(profile);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public record RefreshRequest(String refreshToken) {}
}

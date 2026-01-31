package io.washwise.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.washwise.domain.user.User;
import io.washwise.domain.user.UserRole;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT token service for access and refresh tokens.
 */
@Slf4j
@Service
public class JwtService {

    private final SecretKey accessTokenKey;
    private final SecretKey refreshTokenKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtService(
            @Value("${security.jwt.access-token.secret}") String accessSecret,
            @Value("${security.jwt.access-token.expiration}") long accessExpiration,
            @Value("${security.jwt.refresh-token.secret}") String refreshSecret,
            @Value("${security.jwt.refresh-token.expiration}") long refreshExpiration) {
        this.accessTokenKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        this.refreshTokenKey = Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessExpiration;
        this.refreshTokenExpiration = refreshExpiration;
    }

    /**
     * Generate an access token for a user.
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpiration);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(Map.of(
                        "email", user.getEmail(),
                        "tenantId", user.getTenant().getId().toString(),
                        "role", user.getRole().name()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(accessTokenKey)
                .compact();
    }

    /**
     * Generate a refresh token.
     */
    public String generateRefreshToken(UUID userId, UUID familyId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshTokenExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of("familyId", familyId.toString()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(refreshTokenKey)
                .compact();
    }

    /**
     * Parse and validate an access token.
     */
    public Claims parseAccessToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(accessTokenKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("Access token expired: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            log.warn("Invalid access token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Parse and validate a refresh token.
     */
    public Claims parseRefreshToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(refreshTokenKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("Refresh token expired: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            log.warn("Invalid refresh token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Extract user ID from access token.
     */
    public UUID extractUserId(String token) {
        Claims claims = parseAccessToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extract tenant ID from access token.
     */
    public UUID extractTenantId(String token) {
        Claims claims = parseAccessToken(token);
        return UUID.fromString(claims.get("tenantId", String.class));
    }

    /**
     * Extract role from access token.
     */
    public UserRole extractRole(String token) {
        Claims claims = parseAccessToken(token);
        return UserRole.valueOf(claims.get("role", String.class));
    }

    /**
     * Validate access token without parsing claims.
     */
    public boolean validateAccessToken(String token) {
        try {
            parseAccessToken(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Get refresh token expiration time.
     */
    public Instant getRefreshTokenExpiry() {
        return Instant.now().plusMillis(refreshTokenExpiration);
    }
}

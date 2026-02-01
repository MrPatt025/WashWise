package io.washwise.service;

import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.user.RefreshToken;
import io.washwise.domain.user.User;
import io.washwise.domain.user.UserRole;
import io.washwise.domain.user.UserStatus;
import io.washwise.dto.auth.AuthResponse;
import io.washwise.dto.auth.LoginRequest;
import io.washwise.dto.auth.RegisterRequest;
import io.washwise.dto.user.UserResponse;
import io.washwise.exception.BusinessException;
import io.washwise.exception.ConflictException;
import io.washwise.exception.UnauthorizedException;
import io.washwise.repository.RefreshTokenRepository;
import io.washwise.repository.TenantRepository;
import io.washwise.repository.UserRepository;
import io.washwise.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Register a new tenant and owner user.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String userAgent, String ipAddress) {
        // Generate unique slug
        String slug = generateSlug(request.tenantName());
        
        if (tenantRepository.existsBySlug(slug)) {
            throw new ConflictException("Tenant with similar name already exists");
        }

        // Create tenant
        Tenant tenant = Tenant.builder()
                .name(request.tenantName())
                .slug(slug)
                .ownerEmail(request.email())
                .phone(request.phone())
                .plan("FREE")
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenant = tenantRepository.save(tenant);

        // Check if email already exists for this tenant
        if (userRepository.existsByEmailAndTenantId(request.email(), tenant.getId())) {
            throw new ConflictException("Email already registered");
        }

        // Create owner user
        User user = User.builder()
                .tenant(tenant)
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phone(request.phone())
                .role(UserRole.OWNER)
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        log.info("New tenant registered: {} ({})", tenant.getName(), tenant.getSlug());

        return createAuthResponse(user, userAgent, ipAddress);
    }

    /**
     * Login with email and password.
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String userAgent, String ipAddress) {
        List<User> users = userRepository.findByEmailWithTenant(request.email());
        
        if (users.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password");
        }

        User user;
        if (users.size() == 1) {
            user = users.get(0);
        } else if (request.tenantSlug() != null) {
            user = users.stream()
                    .filter(u -> u.getTenant().getSlug().equals(request.tenantSlug()))
                    .findFirst()
                    .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        } else {
            // Multiple tenants - require tenant selection
            throw new BusinessException("MULTIPLE_TENANTS", "Please specify tenant slug");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }

        if (user.getTenant().getStatus() != Tenant.TenantStatus.ACTIVE) {
            throw new UnauthorizedException("Tenant account is suspended");
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        log.info("User logged in: {} (tenant: {})", user.getEmail(), user.getTenant().getSlug());

        return createAuthResponse(user, userAgent, ipAddress);
    }

    /**
     * Refresh access token using refresh token.
     */
    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue, String userAgent, String ipAddress) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenWithUserAndTenant(refreshTokenValue)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // Check if token was already used (theft detection)
        if (refreshToken.isRevoked()) {
            // Possible token theft - revoke all tokens in the family
            log.warn("Refresh token reuse detected! Revoking all tokens for family: {}", refreshToken.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(refreshToken.getFamilyId(), Instant.now());
            throw new UnauthorizedException("Refresh token has been revoked. Please login again.");
        }

        if (refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        User user = refreshToken.getUser();
        
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }

        // Revoke current token (rotation)
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        // Create new tokens with same family ID
        return createAuthResponse(user, userAgent, ipAddress, refreshToken.getFamilyId());
    }

    /**
     * Logout by revoking refresh token.
     */
    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                    log.info("User logged out: {}", token.getUser().getEmail());
                });
    }

    /**
     * Logout from all devices by revoking all refresh tokens.
     */
    @Transactional
    public void logoutAll(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
        log.info("All sessions revoked for user: {}", userId);
    }

    /**
     * Get current user profile.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId, UUID tenantId) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return UserResponse.from(user);
    }

    private AuthResponse createAuthResponse(User user, String userAgent, String ipAddress) {
        return createAuthResponse(user, userAgent, ipAddress, UUID.randomUUID());
    }

    private AuthResponse createAuthResponse(User user, String userAgent, String ipAddress, UUID familyId) {
        // Generate access token
        String accessToken = jwtService.generateAccessToken(user);

        // Generate refresh token
        String refreshTokenValue = jwtService.generateRefreshToken(user.getId(), familyId);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .familyId(familyId)
                .expiresAt(jwtService.getRefreshTokenExpiry())
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, UserResponse.from(user));
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}

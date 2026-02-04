# WashWise Enterprise - Security Design (DevSecOps)

## 1. Security Overview

### 1.1 Security Principles

| Principle             | Implementation                                                    |
| --------------------- | ----------------------------------------------------------------- |
| **Defense in Depth**  | Multiple security layers at network, application, and data levels |
| **Least Privilege**   | Minimal permissions for each role and service                     |
| **Zero Trust**        | Verify everything, trust nothing by default                       |
| **Secure by Default** | Security enabled out of the box, opt-out for development          |
| **Fail Secure**       | Errors result in denied access, not granted access                |

### 1.2 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PERIMETER SECURITY                                     │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│   │  │   WAF       │  │    DDoS     │  │    TLS      │  │   CDN       │            │   │
│   │  │  (AWS WAF)  │  │ Protection  │  │  1.3 Only   │  │ (CloudFront)│            │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                               │
│   ┌─────────────────────────────────────▼───────────────────────────────────────────┐   │
│   │                          APPLICATION SECURITY                                    │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│   │  │   OAuth2    │  │    RBAC     │  │   Input     │  │    Rate     │            │   │
│   │  │   + OIDC    │  │   + ABAC    │  │ Validation  │  │  Limiting   │            │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│   │  │   CORS      │  │    CSRF     │  │   Content   │  │  Security   │            │   │
│   │  │   Policy    │  │ Protection  │  │   Security  │  │  Headers    │            │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                               │
│   ┌─────────────────────────────────────▼───────────────────────────────────────────┐   │
│   │                            DATA SECURITY                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│   │  │ Encryption  │  │   Tenant    │  │   Secrets   │  │   Audit     │            │   │
│   │  │  at Rest    │  │  Isolation  │  │ Management  │  │   Logging   │            │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Design (OAuth2/OIDC)

### 2.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐           │
│   │ Browser │          │ Frontend│          │ Core API│          │   DB    │           │
│   └────┬────┘          └────┬────┘          └────┬────┘          └────┬────┘           │
│        │                    │                    │                    │                 │
│        │  1. Login Form     │                    │                    │                 │
│        │───────────────────▶│                    │                    │                 │
│        │                    │  2. POST /login    │                    │                 │
│        │                    │───────────────────▶│                    │                 │
│        │                    │                    │  3. Verify creds   │                 │
│        │                    │                    │───────────────────▶│                 │
│        │                    │                    │◀───────────────────│                 │
│        │                    │                    │                    │                 │
│        │                    │                    │  4. Generate tokens│                 │
│        │                    │                    │   (access + refresh)                 │
│        │                    │                    │                    │                 │
│        │                    │                    │  5. Store refresh  │                 │
│        │                    │                    │───────────────────▶│                 │
│        │                    │                    │                    │                 │
│        │                    │  6. Access token   │                    │                 │
│        │                    │  + Set-Cookie      │                    │                 │
│        │                    │◀───────────────────│                    │                 │
│        │                    │                    │                    │                 │
│        │  7. Store access   │                    │                    │                 │
│        │     in memory only │                    │                    │                 │
│        │◀───────────────────│                    │                    │                 │
│        │                    │                    │                    │                 │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Token Strategy

#### Access Token (Short-lived)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-2026-01"
  },
  "payload": {
    "sub": "user_abc123",
    "iss": "https://api.washwise.io",
    "aud": "washwise-api",
    "iat": 1704067200,
    "exp": 1704068100,
    "tenant_id": "tenant_xyz789",
    "role": "OWNER",
    "permissions": ["machines:read", "machines:write", "bookings:*"],
    "branch_ids": ["branch_1", "branch_2"]
  }
}
```

| Property      | Value                      | Reason                                         |
| ------------- | -------------------------- | ---------------------------------------------- |
| **Algorithm** | RS256                      | Asymmetric for service-to-service verification |
| **Lifetime**  | 15 minutes                 | Minimize exposure window                       |
| **Storage**   | Memory only                | Never persisted to localStorage/cookies        |
| **Refresh**   | Silent via HttpOnly cookie | Transparent to user                            |

#### Refresh Token (Long-lived)

```json
{
  "token": "rt_abc123xyz...",
  "user_id": "user_abc123",
  "family_id": "family_def456",
  "device_info": {
    "userAgent": "Mozilla/5.0...",
    "ip": "203.150.x.x"
  },
  "created_at": "2026-01-15T10:00:00Z",
  "expires_at": "2026-01-22T10:00:00Z",
  "revoked": false
}
```

| Property      | Value                  | Reason                          |
| ------------- | ---------------------- | ------------------------------- |
| **Lifetime**  | 7 days                 | Balance between UX and security |
| **Storage**   | HttpOnly secure cookie | XSS protection                  |
| **Rotation**  | Every refresh          | Detect token theft              |
| **Family ID** | Track token lineage    | Reuse detection                 |

### 2.3 Token Rotation & Theft Detection

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                     TOKEN ROTATION & THEFT DETECTION                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   NORMAL FLOW:                                                                           │
│   ────────────                                                                           │
│                                                                                          │
│   RT-1 (family: F1) ──refresh──▶ RT-2 (family: F1) ──refresh──▶ RT-3 (family: F1)      │
│         │                             │                             │                    │
│         ▼                             ▼                             ▼                    │
│      revoked                       revoked                       active                  │
│                                                                                          │
│   ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                          │
│   THEFT DETECTED:                                                                        │
│   ───────────────                                                                        │
│                                                                                          │
│   Attacker steals RT-1                                                                   │
│        │                                                                                 │
│        │                   Legitimate user refreshes                                     │
│        │                         │                                                       │
│        ▼                         ▼                                                       │
│   RT-1 (family: F1)         RT-1 (family: F1)                                           │
│        │                         │                                                       │
│        │                         ▼                                                       │
│        │                   RT-2 (family: F1) ◀── RT-1 revoked                           │
│        │                                                                                 │
│        ▼                                                                                 │
│   Attacker uses RT-1                                                                     │
│        │                                                                                 │
│        ▼                                                                                 │
│   🚨 REUSE DETECTED!                                                                     │
│        │                                                                                 │
│        ▼                                                                                 │
│   INVALIDATE ENTIRE FAMILY F1                                                            │
│   (RT-1, RT-2, all tokens in family)                                                     │
│   User must re-authenticate                                                              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Implementation (Spring Security)

```java
// JwtTokenProvider.java
@Component
public class JwtTokenProvider {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    @Value("${jwt.access-token-validity}")
    private long accessTokenValidity = 900; // 15 minutes

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidity = 604800; // 7 days

    public String generateAccessToken(User user) {
        Instant now = Instant.now();

        return Jwts.builder()
            .header()
                .keyId("key-2026-01")
                .and()
            .subject(user.getId().toString())
            .issuer("https://api.washwise.io")
            .audience().add("washwise-api").and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessTokenValidity)))
            .claim("tenant_id", user.getTenantId())
            .claim("role", user.getRole().name())
            .claim("permissions", user.getPermissions())
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    public RefreshToken generateRefreshToken(User user, String familyId) {
        String token = generateSecureToken();
        String hashedToken = hashToken(token);

        RefreshToken refreshToken = RefreshToken.builder()
            .hashedToken(hashedToken)
            .userId(user.getId())
            .familyId(familyId != null ? familyId : UUID.randomUUID().toString())
            .expiresAt(Instant.now().plusSeconds(refreshTokenValidity))
            .build();

        refreshTokenRepository.save(refreshToken);

        return refreshToken.withPlainToken(token); // Return plain token to client
    }

    public TokenPair refreshTokens(String plainRefreshToken) {
        String hashedToken = hashToken(plainRefreshToken);

        RefreshToken storedToken = refreshTokenRepository
            .findByHashedToken(hashedToken)
            .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        // Check if token was already used (reuse detection)
        if (storedToken.isRevoked()) {
            // Potential theft! Invalidate entire family
            refreshTokenRepository.revokeByFamilyId(
                storedToken.getFamilyId(),
                "Token reuse detected - potential theft"
            );
            throw new TokenTheftException("Security alert: token reuse detected");
        }

        // Check expiration
        if (storedToken.isExpired()) {
            throw new TokenExpiredException("Refresh token expired");
        }

        // Revoke current token
        storedToken.revoke("Normal rotation");
        refreshTokenRepository.save(storedToken);

        // Generate new token pair
        User user = userRepository.findById(storedToken.getUserId())
            .orElseThrow();

        String newAccessToken = generateAccessToken(user);
        RefreshToken newRefreshToken = generateRefreshToken(user, storedToken.getFamilyId());

        return new TokenPair(newAccessToken, newRefreshToken);
    }
}
```

---

## 3. Authorization (RBAC + ABAC)

### 3.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           ROLE HIERARCHY                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                            ┌─────────────────┐                                           │
│                            │   SUPER_ADMIN   │                                           │
│                            │  (Platform-wide)│                                           │
│                            └────────┬────────┘                                           │
│                                     │                                                    │
│                            ┌────────▼────────┐                                           │
│                            │      OWNER      │                                           │
│                            │  (Tenant Admin) │                                           │
│                            └────────┬────────┘                                           │
│                                     │                                                    │
│                            ┌────────▼────────┐                                           │
│                            │      STAFF      │                                           │
│                            │ (Branch Worker) │                                           │
│                            └────────┬────────┘                                           │
│                                     │                                                    │
│                            ┌────────▼────────┐                                           │
│                            │    CUSTOMER     │                                           │
│                            │   (End User)    │                                           │
│                            └─────────────────┘                                           │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Permission Matrix

| Permission      | SUPER_ADMIN |   OWNER    |    STAFF    | CUSTOMER |
| --------------- | :---------: | :--------: | :---------: | :------: |
| **Tenants**     |
| tenants:create  |     ✅      |     ❌     |     ❌      |    ❌    |
| tenants:read    |     ✅      |    Own     |     ❌      |    ❌    |
| tenants:update  |     ✅      |    Own     |     ❌      |    ❌    |
| tenants:delete  |     ✅      |     ❌     |     ❌      |    ❌    |
| **Users**       |
| users:create    |     ✅      | Own tenant |     ❌      |    ❌    |
| users:read      |     ✅      | Own tenant | Own branch  |   Self   |
| users:update    |     ✅      | Own tenant |    Self     |   Self   |
| users:delete    |     ✅      | Own tenant |     ❌      |    ❌    |
| **Machines**    |
| machines:create |     ✅      |     ✅     |     ❌      |    ❌    |
| machines:read   |     ✅      |     ✅     | Own branch  |    ✅    |
| machines:update |     ✅      |     ✅     | Status only |    ❌    |
| machines:delete |     ✅      |     ✅     |     ❌      |    ❌    |
| **Bookings**    |
| bookings:create |     ✅      |     ✅     |     ✅      |    ✅    |
| bookings:read   |     ✅      | Own tenant | Own branch  |   Own    |
| bookings:cancel |     ✅      |     ✅     | Own branch  |   Own    |
| **Payments**    |
| payments:read   |     ✅      | Own tenant | Own branch  |   Own    |
| payments:refund |     ✅      |     ✅     |     ❌      |    ❌    |
| **Analytics**   |
| analytics:read  |     ✅      | Own tenant | Own branch  |    ❌    |

### 3.3 Attribute-Based Access Control (ABAC)

```java
// SecurityPolicy.java
@Component
public class SecurityPolicy {

    // Policy: User can only access resources within their tenant
    public boolean canAccessTenant(Authentication auth, UUID tenantId) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return principal.getTenantId().equals(tenantId) ||
               principal.hasRole(Role.SUPER_ADMIN);
    }

    // Policy: Staff can only access their assigned branch
    public boolean canAccessBranch(Authentication auth, UUID branchId) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        if (principal.hasRole(Role.SUPER_ADMIN) || principal.hasRole(Role.OWNER)) {
            return canAccessTenant(auth, getBranchTenantId(branchId));
        }

        return principal.getBranchIds().contains(branchId);
    }

    // Policy: Customer can only see their own bookings
    public boolean canAccessBooking(Authentication auth, Booking booking) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

        if (principal.hasRole(Role.SUPER_ADMIN)) return true;
        if (principal.hasRole(Role.OWNER)) {
            return canAccessTenant(auth, booking.getTenantId());
        }
        if (principal.hasRole(Role.STAFF)) {
            return canAccessBranch(auth, booking.getMachine().getBranchId());
        }

        // Customer
        return booking.getUserId().equals(principal.getUserId());
    }
}

// Usage in Controller
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @PreAuthorize("@securityPolicy.canAccessBooking(authentication, #booking)")
    @GetMapping("/{bookingId}")
    public BookingResponse getBooking(@PathVariable UUID bookingId) {
        Booking booking = bookingService.findById(bookingId);
        return BookingResponse.from(booking);
    }
}
```

---

## 4. OWASP Top 10 Mitigations

### 4.1 A01: Broken Access Control (IDOR)

**Threat:** User manipulates IDs to access other tenants' data

**Mitigation:**

```java
// Always include tenantId in queries - IDOR Protection
@Repository
public interface MachineRepository extends JpaRepository<Machine, UUID> {

    // ❌ VULNERABLE: Only checks machineId
    // Optional<Machine> findById(UUID id);

    // ✅ SECURE: Always includes tenantId
    @Query("SELECT m FROM Machine m WHERE m.id = :id AND m.tenant.id = :tenantId")
    Optional<Machine> findByIdAndTenantId(UUID id, UUID tenantId);
}

// Service layer
@Service
public class MachineService {

    public Machine getMachine(UUID machineId) {
        UUID tenantId = SecurityContext.getCurrentTenantId();

        return machineRepository.findByIdAndTenantId(machineId, tenantId)
            .orElseThrow(() -> new NotFoundException("Machine not found"));
        // Returns 404 (not 403) to prevent enumeration
    }
}
```

### 4.2 A02: Cryptographic Failures

**Mitigations:**

```yaml
# TLS Configuration
server:
  ssl:
    enabled: true
    protocol: TLSv1.3
    ciphers:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256

# Password Hashing: Argon2id
password:
  encoder: argon2id
  memory: 65536 # 64MB
  iterations: 3
  parallelism: 4

# Data at Rest: AWS KMS
database:
  encryption:
    enabled: true
    kms-key-id: ${AWS_KMS_KEY_ID}
```

### 4.3 A03: Injection

**SQL Injection Prevention:**

```java
// ❌ VULNERABLE
@Query(value = "SELECT * FROM machines WHERE name = '" + name + "'", nativeQuery = true)

// ✅ SECURE: Parameterized query
@Query("SELECT m FROM Machine m WHERE m.name = :name")
List<Machine> findByName(@Param("name") String name);

// ✅ SECURE: JPA Criteria API
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<Machine> query = cb.createQuery(Machine.class);
Root<Machine> root = query.from(Machine.class);
query.where(cb.equal(root.get("name"), name));
```

**NoSQL Injection Prevention (MongoDB):**

```javascript
// ❌ VULNERABLE
db.conversations.find({ tenantId: req.query.tenantId });

// ✅ SECURE: Schema validation + type checking
const tenantId = new ObjectId(req.query.tenantId); // Throws on invalid
db.conversations.find({ tenantId: tenantId });
```

### 4.4 A04: Insecure Design

**Booking System - Prevent Race Conditions:**

```java
@Service
public class BookingService {

    private final RedisTemplate<String, String> redisTemplate;

    @Transactional
    public Booking createBooking(CreateBookingRequest request) {
        // 1. Acquire distributed lock
        String lockKey = String.format("lock:booking:machine:%s:slot:%s",
            request.getMachineId(),
            request.getStartAt().toString());

        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, UUID.randomUUID().toString(), Duration.ofSeconds(10));

        if (!Boolean.TRUE.equals(acquired)) {
            throw new ConflictException("Slot is being booked by another user");
        }

        try {
            // 2. Check idempotency
            if (request.getIdempotencyKey() != null) {
                Optional<Booking> existing = bookingRepository
                    .findByIdempotencyKey(request.getIdempotencyKey());
                if (existing.isPresent()) {
                    return existing.get(); // Return existing booking
                }
            }

            // 3. Verify slot availability (with DB-level exclusion constraint)
            boolean available = bookingRepository.isSlotAvailable(
                request.getMachineId(),
                request.getStartAt(),
                request.getEndAt()
            );

            if (!available) {
                throw new ConflictException("Time slot no longer available");
            }

            // 4. Create booking
            Booking booking = Booking.builder()
                .machineId(request.getMachineId())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .idempotencyKey(request.getIdempotencyKey())
                .build();

            return bookingRepository.save(booking);

        } finally {
            // 5. Release lock
            redisTemplate.delete(lockKey);
        }
    }
}
```

### 4.5 A05: Security Misconfiguration

**Security Headers:**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "connect-src 'self' https://api.washwise.io wss://api.washwise.io"))
                .frameOptions(fo -> fo.deny())
                .xssProtection(xss -> xss.enable())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicy(pp -> pp.policy("geolocation=(), microphone=(), camera=()"))
            )
            .hsts(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000) // 1 year
                .preload(true));

        return http.build();
    }
}
```

### 4.6 A06: Vulnerable Components

**Dependency Scanning (GitHub Actions):**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 0 * * *" # Daily

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Java dependencies
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "WashWise"
          path: "services/core-api"
          format: "HTML"

      # Python dependencies
      - name: Safety Check
        run: |
          pip install safety
          safety check -r services/ai-worker/requirements.txt

      # Node.js dependencies
      - name: NPM Audit
        working-directory: apps/web-admin
        run: npm audit --audit-level=high

      # Container scanning
      - name: Trivy Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "washwise/core-api:latest"
          severity: "CRITICAL,HIGH"
```

### 4.7 A07: Authentication Failures

**Account Lockout:**

```java
@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> {
                // Constant-time response to prevent user enumeration
                simulatePasswordVerification();
                return new AuthException("Invalid credentials");
            });

        // Check if account is locked
        if (user.isLocked()) {
            throw new AccountLockedException(
                "Account locked. Try again after " + user.getLockedUntil()
            );
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new AuthException("Invalid credentials");
        }

        // Reset failed attempts on success
        user.resetFailedAttempts();
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    private void handleFailedLogin(User user) {
        user.incrementFailedAttempts();

        if (user.getFailedLoginCount() >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil(Instant.now().plus(LOCKOUT_DURATION));

            // Notify user of lockout
            notificationService.sendSecurityAlert(user, "Account locked due to failed login attempts");

            // Log security event
            auditService.log(AuditEvent.builder()
                .action("account.locked")
                .actorId(user.getId())
                .severity(Severity.WARNING)
                .details(Map.of("reason", "max_failed_attempts"))
                .build());
        }

        userRepository.save(user);
    }
}
```

### 4.8 A08: Software & Data Integrity

**Webhook Signature Verification:**

```java
@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    @Value("${stripe.webhook-secret}")
    private String stripeWebhookSecret;

    @PostMapping("/stripe")
    public ResponseEntity<Void> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        try {
            // Verify webhook signature
            Event event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);

            // Process event
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentSuccess(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentFailure(event);
                    break;
            }

            return ResponseEntity.ok().build();

        } catch (SignatureVerificationException e) {
            log.warn("Invalid webhook signature: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
```

### 4.9 A09: Logging & Monitoring

```java
// AuditService.java
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(AuditEvent event) {
        // Get request context
        HttpServletRequest request = getCurrentRequest();

        AuditLog auditLog = AuditLog.builder()
            .tenantId(event.getTenantId())
            .actorId(event.getActorId())
            .actorType(event.getActorType())
            .actorName(event.getActorName())
            .action(event.getAction())
            .entityType(event.getEntityType())
            .entityId(event.getEntityId())
            .oldValues(event.getOldValues())
            .newValues(event.getNewValues())
            .description(event.getDescription())
            .ipAddress(getClientIp(request))
            .userAgent(request.getHeader("User-Agent"))
            .requestId(MDC.get("requestId"))
            .severity(event.getSeverity())
            .timestamp(Instant.now())
            .build();

        auditLogRepository.save(auditLog);

        // Send to SIEM for critical events
        if (event.getSeverity() == Severity.CRITICAL) {
            siemIntegration.sendAlert(auditLog);
        }
    }

    // Log format (JSON for easy parsing)
    // {
    //   "timestamp": "2026-01-15T10:30:00Z",
    //   "level": "INFO",
    //   "action": "booking.create",
    //   "actor": {"id": "user_123", "role": "CUSTOMER"},
    //   "tenant_id": "tenant_456",
    //   "entity": {"type": "booking", "id": "booking_789"},
    //   "request_id": "req_abc123",
    //   "ip_address": "203.150.x.x",
    //   "duration_ms": 45
    // }
}
```

### 4.10 A10: SSRF Prevention

```java
// Safe external URL validation
@Component
public class UrlValidator {

    private static final Set<String> BLOCKED_HOSTS = Set.of(
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "169.254.169.254",  // AWS metadata
        "metadata.google.internal"
    );

    private static final Set<String> ALLOWED_SCHEMES = Set.of("https");

    public void validateExternalUrl(String urlString) {
        try {
            URL url = new URL(urlString);

            // Check scheme
            if (!ALLOWED_SCHEMES.contains(url.getProtocol())) {
                throw new SecurityException("Invalid URL scheme");
            }

            // Check host
            String host = url.getHost().toLowerCase();
            if (BLOCKED_HOSTS.contains(host)) {
                throw new SecurityException("Blocked host");
            }

            // Check for IP address in private ranges
            InetAddress address = InetAddress.getByName(host);
            if (address.isLoopbackAddress() ||
                address.isLinkLocalAddress() ||
                address.isSiteLocalAddress()) {
                throw new SecurityException("Private IP not allowed");
            }

        } catch (MalformedURLException | UnknownHostException e) {
            throw new SecurityException("Invalid URL");
        }
    }
}
```

---

## 5. Rate Limiting

### 5.1 Rate Limit Configuration

```java
@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimiter authRateLimiter() {
        return RateLimiter.builder()
            .name("auth")
            .limitForPeriod(5)          // 5 requests
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .timeoutDuration(Duration.ZERO)
            .build();
    }

    @Bean
    public RateLimiter apiRateLimiter() {
        return RateLimiter.builder()
            .name("api")
            .limitForPeriod(100)        // 100 requests
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .timeoutDuration(Duration.ZERO)
            .build();
    }
}
```

### 5.2 Rate Limit by Tier

| Endpoint              |  FREE   |  BASIC  |   PRO    | ENTERPRISE |
| --------------------- | :-----: | :-----: | :------: | :--------: |
| Auth (login/register) |  5/min  | 10/min  |  20/min  |   50/min   |
| API (general)         | 100/min | 500/min | 2000/min | 10000/min  |
| AI Chat               | 10/min  | 50/min  | 200/min  |  1000/min  |
| Webhooks              | 100/min | 500/min | 2000/min | 10000/min  |

---

## 6. Secrets Management

### 6.1 AWS Secrets Manager Integration

```java
@Configuration
public class SecretsConfig {

    private final SecretsManagerClient secretsManager;

    @PostConstruct
    public void loadSecrets() {
        // Load secrets at startup
        String secretJson = secretsManager.getSecretValue(
            GetSecretValueRequest.builder()
                .secretId("washwise/prod/core-api")
                .build()
        ).secretString();

        Map<String, String> secrets = objectMapper.readValue(secretJson, Map.class);

        // Set as system properties
        secrets.forEach(System::setProperty);
    }
}
```

### 6.2 Secret Rotation

```yaml
# Terraform: Secrets Manager with rotation
resource "aws_secretsmanager_secret" "db_credentials" { name =
"washwise/${var.environment}/database"

tags = { Environment = var.environment Application = "washwise" } }

resource "aws_secretsmanager_secret_rotation" "db_credentials" { secret_id           =
aws_secretsmanager_secret.db_credentials.id rotation_lambda_arn =
aws_lambda_function.rotate_secret.arn

rotation_rules { automatically_after_days = 30 } }
```

---

## 7. API Server Security Plugin (Node.js/Fastify)

The WashWise API Server implements comprehensive security measures through an enterprise-grade security plugin that adheres to OWASP, NIST, and ISO 27001 standards.

### 7.1 Security Configuration

```typescript
const SECURITY_CONFIG = {
  // Rate limiting thresholds
  SUSPICIOUS_THRESHOLD: 100,      // Requests per minute
  BRUTE_FORCE_THRESHOLD: 5,       // Failed attempts before lockout
  LOCKOUT_DURATION: 900000,       // 15 minute lockout

  // Security events for SIEM integration
  SECURITY_EVENTS: {
    BRUTE_FORCE_DETECTED: "BRUTE_FORCE_DETECTED",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    SQL_INJECTION_ATTEMPT: "SQL_INJECTION_ATTEMPT",
    XSS_ATTEMPT: "XSS_ATTEMPT",
    COMMAND_INJECTION_ATTEMPT: "COMMAND_INJECTION_ATTEMPT",
    PATH_TRAVERSAL_ATTEMPT: "PATH_TRAVERSAL_ATTEMPT",
    CSRF_VIOLATION: "CSRF_VIOLATION",
  },
};
```

### 7.2 Security Headers

| Header                           | Value                           | Purpose                        |
| -------------------------------- | ------------------------------- | ------------------------------ |
| **X-Content-Type-Options**       | nosniff                         | Prevent MIME sniffing          |
| **X-Frame-Options**              | DENY                            | Prevent clickjacking           |
| **X-XSS-Protection**             | 1; mode=block                   | XSS protection (legacy)        |
| **Referrer-Policy**              | strict-origin-when-cross-origin | Control referrer leakage       |
| **Content-Security-Policy**      | Comprehensive directives        | Prevent code injection         |
| **Permissions-Policy**           | Restrict all features           | Limit browser capabilities     |
| **Cross-Origin-Embedder-Policy** | require-corp                    | Cross-origin isolation         |
| **Cross-Origin-Opener-Policy**   | same-origin                     | Prevent window references      |
| **Cache-Control**                | no-store, no-cache              | Prevent sensitive data caching |
| **Clear-Site-Data**              | "cache", "storage"              | Clear browser data             |

### 7.3 Attack Pattern Detection

The security plugin detects and blocks the following attack types:

| Attack Type           | Detection Patterns                                               |
| --------------------- | ---------------------------------------------------------------- |
| **XSS**               | script tags, javascript:, event handlers, data: URLs, svg onload |
| **SQL Injection**     | UNION SELECT, DROP TABLE, DELETE FROM, OR '1'='1, waitfor delay  |
| **NoSQL Injection**   | $where, $ne, $gt, $regex, $or operators                          |
| **Command Injection** | cat, ls, rm, wget, curl, backticks, $()                          |
| **Path Traversal**    | ../, ..%2f, ..%5c, encoded traversal sequences                   |
| **LDAP Injection**    | Special characters (),                                           | , *, \\ |
| **Header Injection**  | CRLF sequences \\r\\n, %0d%0a                                    |

### 7.4 Brute Force Protection

```typescript
// Track failed authentication attempts
fastify.trackFailedAuth(identifier);

// Check if user is locked out
if (fastify.isLockedOut(identifier)) {
  return reply.status(429).send({ message: "Too many attempts" });
}

// Clear on successful auth
fastify.clearFailedAttempts(identifier);
```

### 7.5 Security Event Logging

All security events are logged with structured data for SIEM integration:

```typescript
fastify.securityEvent(
  "TENANT_VIOLATION",
  request,
  {
    attemptedTenantId: resourceTenantId,
    actualTenantId: request.user.tenantId,
    severity: "critical"
  }
);
```

### 7.6 CSRF Protection

```typescript
// Generate CSRF token
const csrfToken = fastify.generateCsrfToken();
reply.cookie("csrf-token", csrfToken, { httpOnly: false, secure: true });

// Verify on state-changing requests
await fastify.verifyCsrfToken(request, reply);
```

### 7.7 Tenant Isolation Verification

Anti-IDOR protection with detailed logging:

```typescript
// Verify tenant access - returns 404 to prevent enumeration
await fastify.verifyTenantAccess(request, reply, resourceTenantId);
```

---

## 8. CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.toArray(new String[0]))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Requested-With",
                          "X-Idempotency-Key", "X-Tenant-ID")
            .exposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining",
                          "X-RateLimit-Reset", "X-Request-ID")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

## 9. Security Checklist

### Pre-Deployment

- [ ] All secrets in AWS Secrets Manager (not in code/config)
- [ ] TLS 1.3 enabled, older versions disabled
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting enabled for all endpoints
- [ ] Input validation on all user inputs
- [ ] Output encoding for XSS prevention
- [ ] CSRF protection for state-changing operations
- [ ] Audit logging for security events
- [ ] Dependency vulnerability scan passed
- [ ] SAST scan passed (SonarQube, Semgrep)
- [ ] Container image scan passed (Trivy)
- [ ] Penetration test completed

### Post-Deployment

- [ ] WAF rules configured
- [ ] DDoS protection enabled
- [ ] CloudWatch alarms for security events
- [ ] Log aggregation and SIEM integration
- [ ] Incident response runbook documented
- [ ] Security monitoring dashboard active

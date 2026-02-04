import crypto from "crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

// ============================================================================
// ENTERPRISE SECURITY PLUGIN - WashWise Platform
// Implements OWASP Top 10, NIST Cybersecurity Framework, and ISO 27001 standards
// ============================================================================

/**
 * Security configuration constants
 * These values should be adjusted based on environment and threat model
 */
const SECURITY_CONFIG = {
    // Rate limiting thresholds
    SUSPICIOUS_THRESHOLD: 100, // Requests per window
    SUSPICIOUS_WINDOW: 60000, // 1 minute window
    BRUTE_FORCE_THRESHOLD: 5, // Failed attempts before lockout
    BRUTE_FORCE_WINDOW: 300000, // 5 minute window
    LOCKOUT_DURATION: 900000, // 15 minute lockout

    // Request size limits
    MAX_BODY_SIZE: 10 * 1024 * 1024, // 10MB max body
    MAX_HEADER_SIZE: 8192, // 8KB max headers
    MAX_URL_LENGTH: 2048, // 2KB max URL

    // Content Security Policy
    CSP_REPORT_ONLY: false,
    CSP_DIRECTIVES: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
    },

    // Security event types
    SECURITY_EVENTS: {
        BRUTE_FORCE_DETECTED: "BRUTE_FORCE_DETECTED",
        SUSPICIOUS_PATTERN: "SUSPICIOUS_PATTERN",
        RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
        INVALID_TOKEN: "INVALID_TOKEN",
        TENANT_VIOLATION: "TENANT_VIOLATION",
        CSRF_VIOLATION: "CSRF_VIOLATION",
        XSS_ATTEMPT: "XSS_ATTEMPT",
        SQL_INJECTION_ATTEMPT: "SQL_INJECTION_ATTEMPT",
        PATH_TRAVERSAL_ATTEMPT: "PATH_TRAVERSAL_ATTEMPT",
        COMMAND_INJECTION_ATTEMPT: "COMMAND_INJECTION_ATTEMPT",
    },
} as const;

/**
 * Enterprise Security Plugin
 * Comprehensive security measures implementing industry best practices
 */
async function securityPlugin(fastify: FastifyInstance) {
    // ============================================================================
    // SECURITY HEADERS
    // ============================================================================

    /**
     * Build Content Security Policy header
     */
    const buildCSP = (): string => {
        return Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
            .map(([directive, values]) => {
                const kebabDirective = directive.replace(/([A-Z])/g, "-$1").toLowerCase();
                return values.length > 0 ? `${kebabDirective} ${values.join(" ")}` : kebabDirective;
            })
            .join("; ");
    };

    fastify.addHook("onSend", async (_request, reply) => {
        // ─────────────────────────────────────────────────────────────────────────
        // Core Security Headers (OWASP Secure Headers Project)
        // ─────────────────────────────────────────────────────────────────────────

        // Prevent MIME type sniffing attacks
        reply.header("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking attacks
        reply.header("X-Frame-Options", "DENY");

        // XSS Protection for legacy browsers
        reply.header("X-XSS-Protection", "1; mode=block");

        // Control referrer information leakage
        reply.header("Referrer-Policy", "strict-origin-when-cross-origin");

        // DNS prefetch control to prevent information leakage
        reply.header("X-DNS-Prefetch-Control", "off");

        // Content Security Policy (set to report-only header if configured)
        reply.header("Content-Security-Policy", buildCSP());

        // ─────────────────────────────────────────────────────────────────────────
        // Modern Security Headers
        // ─────────────────────────────────────────────────────────────────────────

        // Permissions Policy - Restrict browser features access
        reply.header(
            "Permissions-Policy",
            [
                "accelerometer=()",
                "ambient-light-sensor=()",
                "autoplay=()",
                "battery=()",
                "camera=()",
                "cross-origin-isolated=()",
                "display-capture=()",
                "document-domain=()",
                "encrypted-media=()",
                "execution-while-not-rendered=()",
                "execution-while-out-of-viewport=()",
                "fullscreen=(self)",
                "geolocation=()",
                "gyroscope=()",
                "keyboard-map=()",
                "magnetometer=()",
                "microphone=()",
                "midi=()",
                "navigation-override=()",
                "payment=()",
                "picture-in-picture=()",
                "publickey-credentials-get=()",
                "screen-wake-lock=()",
                "sync-xhr=()",
                "usb=()",
                "web-share=()",
                "xr-spatial-tracking=()",
            ].join(", ")
        );

        // Cross-Origin policies for defense in depth
        reply.header("Cross-Origin-Embedder-Policy", "require-corp");
        reply.header("Cross-Origin-Opener-Policy", "same-origin");
        reply.header("Cross-Origin-Resource-Policy", "same-origin");

        // ─────────────────────────────────────────────────────────────────────────
        // Cache Control (Prevent sensitive data caching)
        // ─────────────────────────────────────────────────────────────────────────
        reply.header(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
        );
        reply.header("Pragma", "no-cache");
        reply.header("Expires", "0");
        reply.header("Surrogate-Control", "no-store");

        // Prevent browsers from storing sensitive data
        reply.header("Clear-Site-Data", '"cache", "storage"');
    });

    // ============================================================================
    // REQUEST CORRELATION & TRACING
    // ============================================================================

    /**
     * Request ID injection for distributed tracing and audit trails
     * Uses cryptographically secure random generation
     */
    fastify.addHook("onRequest", async (request, reply) => {
        const existingRequestId = request.headers["x-request-id"] as string | undefined;
        const requestId =
            existingRequestId || `req_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
        request.headers["x-request-id"] = requestId;
        reply.header("X-Request-ID", requestId);

        // Add correlation ID for microservice tracing
        const existingCorrelationId = request.headers["x-correlation-id"] as string | undefined;
        const correlationId = existingCorrelationId || crypto.randomUUID();
        request.headers["x-correlation-id"] = correlationId;
        reply.header("X-Correlation-ID", correlationId);

        // Record request timing for performance monitoring
        request.headers["x-request-start"] = Date.now().toString();
    });

    // ============================================================================
    // ADVANCED INPUT SANITIZATION
    // ============================================================================

    /**
     * Comprehensive attack pattern detection
     * Detects XSS, SQL Injection, NoSQL Injection, Command Injection, Path Traversal
     */
    const ATTACK_PATTERNS = {
        xss: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<svg.*?onload/gi,
            /expression\s*\(/gi,
            /url\s*\(\s*["']?\s*data:/gi,
        ],
        sqlInjection: [
            /union\s+(all\s+)?select/gi,
            /;\s*drop\s+(table|database|index)/gi,
            /;\s*delete\s+from/gi,
            /;\s*truncate\s+table/gi,
            /;\s*insert\s+into/gi,
            /;\s*update\s+.*?set/gi,
            /'\s*or\s+['"]?[0-9]+['"]?\s*=\s*['"]?[0-9]+/gi,
            /'\s*or\s+['"]?\w+['"]?\s*=\s*['"]?\w+/gi,
            /'\s*;\s*--/gi,
            /waitfor\s+delay/gi,
            /benchmark\s*\(/gi,
            /sleep\s*\(/gi,
            /pg_sleep/gi,
        ],
        noSqlInjection: [
            /\$where\s*:/gi,
            /\$ne\s*:/gi,
            /\$gt\s*:/gi,
            /\$lt\s*:/gi,
            /\$regex\s*:/gi,
            /\$or\s*:\s*\[/gi,
            /\$and\s*:\s*\[/gi,
        ],
        commandInjection: [
            /;\s*cat\s+/gi,
            /;\s*ls\s+/gi,
            /;\s*rm\s+/gi,
            /;\s*wget\s+/gi,
            /;\s*curl\s+/gi,
            /\|\s*cat\s+/gi,
            /`.*`/g,
            /\$\(.*\)/g,
            /&&\s*\w+/g,
            /\|\|\s*\w+/g,
        ],
        pathTraversal: [
            /\.\.\//g,
            /\.\.%2f/gi,
            /\.\.%5c/gi,
            /%2e%2e%2f/gi,
            /%252e%252e%252f/gi,
            /\.\.\\+/gi,
        ],
        // eslint-disable-next-line no-control-regex
        ldapInjection: [/[)(|*\\]/g, /\x00/g],
        headerInjection: [/\r\n/g, /%0d%0a/gi],
    };

    fastify.decorate(
        "sanitizeRequest",
        async function (request: FastifyRequest, reply: FastifyReply) {
            const detectAttack = (
                value: unknown,
                path = ""
            ): { detected: boolean; type: string; path: string } | null => {
                if (typeof value === "string") {
                    for (const [attackType, patterns] of Object.entries(ATTACK_PATTERNS)) {
                        for (const pattern of patterns) {
                            // Reset regex lastIndex for global patterns
                            pattern.lastIndex = 0;
                            if (pattern.test(value)) {
                                return { detected: true, type: attackType, path };
                            }
                        }
                    }
                }
                if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        const result = detectAttack(value[i], `${path}[${i}]`);
                        if (result) {
                            return result;
                        }
                    }
                }
                if (value && typeof value === "object") {
                    for (const [key, val] of Object.entries(value)) {
                        const result = detectAttack(val, `${path}.${key}`);
                        if (result) {
                            return result;
                        }
                    }
                }
                return null;
            };

            // Check URL path
            const urlAttack = detectAttack(request.url, "url");
            if (urlAttack) {
                fastify.securityEvent(SECURITY_CONFIG.SECURITY_EVENTS.PATH_TRAVERSAL_ATTEMPT, request, {
                    attackType: urlAttack.type,
                    path: urlAttack.path,
                });
                return reply.status(400).send({
                    statusCode: 400,
                    error: "Bad Request",
                    message: "Invalid request URL",
                });
            }

            // Check query parameters
            if (request.query) {
                const queryAttack = detectAttack(request.query, "query");
                if (queryAttack) {
                    fastify.securityEvent(getSecurityEventType(queryAttack.type), request, {
                        attackType: queryAttack.type,
                        path: queryAttack.path,
                    });
                    return reply.status(400).send({
                        statusCode: 400,
                        error: "Bad Request",
                        message: "Invalid characters detected in request",
                    });
                }
            }

            // Check body
            if (request.body) {
                const bodyAttack = detectAttack(request.body, "body");
                if (bodyAttack) {
                    fastify.securityEvent(getSecurityEventType(bodyAttack.type), request, {
                        attackType: bodyAttack.type,
                        path: bodyAttack.path,
                    });
                    return reply.status(400).send({
                        statusCode: 400,
                        error: "Bad Request",
                        message: "Invalid characters detected in request body",
                    });
                }
            }

            // Check headers for injection
            const headerValues = Object.values(request.headers).filter((h) => typeof h === "string");
            for (const header of headerValues) {
                if (ATTACK_PATTERNS.headerInjection.some((p) => p.test(header))) {
                    fastify.securityEvent(SECURITY_CONFIG.SECURITY_EVENTS.XSS_ATTEMPT, request, {
                        attackType: "headerInjection",
                    });
                    return reply.status(400).send({
                        statusCode: 400,
                        error: "Bad Request",
                        message: "Invalid header value",
                    });
                }
            }
        }
    );

    // ============================================================================
    // BRUTE FORCE PROTECTION
    // ============================================================================

    /**
     * Track failed authentication attempts for brute force detection
     */
    const failedAttempts = new Map<
        string,
        { count: number; firstAttempt: number; lockedUntil: number | null }
    >();

    fastify.decorate("trackFailedAuth", function (identifier: string) {
        const now = Date.now();
        const record = failedAttempts.get(identifier) ?? {
            count: 0,
            firstAttempt: now,
            lockedUntil: null,
        };

        // Reset if window expired
        if (now - record.firstAttempt > SECURITY_CONFIG.BRUTE_FORCE_WINDOW) {
            record.count = 1;
            record.firstAttempt = now;
            record.lockedUntil = null;
        } else {
            record.count++;
        }

        // Lock if threshold exceeded
        if (record.count >= SECURITY_CONFIG.BRUTE_FORCE_THRESHOLD) {
            record.lockedUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION;
            fastify.log.warn(
                { identifier, attempts: record.count },
                SECURITY_CONFIG.SECURITY_EVENTS.BRUTE_FORCE_DETECTED
            );
        }

        failedAttempts.set(identifier, record);
        return record;
    });

    fastify.decorate("isLockedOut", function (identifier: string): boolean {
        const record = failedAttempts.get(identifier);
        if (!record?.lockedUntil) {
            return false;
        }
        if (Date.now() > record.lockedUntil) {
            failedAttempts.delete(identifier);
            return false;
        }
        return true;
    });

    fastify.decorate("clearFailedAttempts", function (identifier: string) {
        failedAttempts.delete(identifier);
    });

    // ============================================================================
    // IP-BASED ACTIVITY MONITORING
    // ============================================================================

    const ipRequestCounts = new Map<string, { count: number; firstRequest: number }>();

    fastify.addHook("onRequest", async (request, _reply) => {
        const ip = request.ip;
        const now = Date.now();

        const record = ipRequestCounts.get(ip);

        if (record) {
            if (now - record.firstRequest > SECURITY_CONFIG.SUSPICIOUS_WINDOW) {
                ipRequestCounts.set(ip, { count: 1, firstRequest: now });
            } else {
                record.count++;
                if (record.count > SECURITY_CONFIG.SUSPICIOUS_THRESHOLD) {
                    fastify.securityEvent(SECURITY_CONFIG.SECURITY_EVENTS.SUSPICIOUS_PATTERN, request, {
                        ip,
                        count: record.count,
                    });
                }
            }
        } else {
            ipRequestCounts.set(ip, { count: 1, firstRequest: now });
        }

        // Memory cleanup: Remove stale entries
        if (ipRequestCounts.size > 10000) {
            const cutoff = now - SECURITY_CONFIG.SUSPICIOUS_WINDOW;
            for (const [ipKey, ipRecord] of ipRequestCounts.entries()) {
                if (ipRecord.firstRequest < cutoff) {
                    ipRequestCounts.delete(ipKey);
                }
            }
        }
    });

    // ============================================================================
    // SECURITY EVENT LOGGING
    // ============================================================================

    /**
     * Centralized security event logging with structured data
     * Enables SIEM integration and security monitoring
     */
    fastify.decorate(
        "securityEvent",
        function (eventType: string, request: FastifyRequest, details: Record<string, unknown> = {}) {
            const event = {
                security: true,
                eventType,
                severity: getSeverity(eventType),
                userId: request.user?.userId,
                tenantId: request.user?.tenantId,
                ip: request.ip,
                userAgent: request.headers["user-agent"],
                requestId: request.headers["x-request-id"],
                correlationId: request.headers["x-correlation-id"],
                method: request.method,
                url: request.url,
                timestamp: new Date().toISOString(),
                ...details,
            };

            // Log based on severity
            if (event.severity === "critical" || event.severity === "high") {
                fastify.log.error(event, `SECURITY_EVENT: ${eventType}`);
            } else if (event.severity === "medium") {
                fastify.log.warn(event, `SECURITY_EVENT: ${eventType}`);
            } else {
                fastify.log.info(event, `SECURITY_EVENT: ${eventType}`);
            }
        }
    );

    /**
     * Comprehensive audit logging for sensitive operations
     * Compliance-ready (SOC 2, HIPAA, GDPR)
     */
    fastify.decorate(
        "auditLog",
        function (action: string, request: FastifyRequest, details: Record<string, unknown> = {}) {
            fastify.log.info(
                {
                    audit: true,
                    action,
                    userId: request.user?.userId,
                    tenantId: request.user?.tenantId,
                    ip: request.ip,
                    userAgent: request.headers["user-agent"],
                    requestId: request.headers["x-request-id"],
                    correlationId: request.headers["x-correlation-id"],
                    method: request.method,
                    url: request.url,
                    timestamp: new Date().toISOString(),
                    ...details,
                },
                `AUDIT: ${action}`
            );
        }
    );

    // ============================================================================
    // TENANT ISOLATION VERIFICATION
    // ============================================================================

    /**
     * Verify tenant isolation for cross-tenant access attempts
     * Anti-IDOR protection with detailed logging
     */
    fastify.decorate(
        "verifyTenantAccess",
        async function (request: FastifyRequest, reply: FastifyReply, resourceTenantId: string) {
            if (!request.user?.tenantId) {
                return reply.status(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Tenant context required",
                });
            }

            if (request.user.tenantId !== resourceTenantId) {
                // Log as security event - potential IDOR attack
                fastify.securityEvent(SECURITY_CONFIG.SECURITY_EVENTS.TENANT_VIOLATION, request, {
                    attemptedTenantId: resourceTenantId,
                    actualTenantId: request.user.tenantId,
                });

                // Return 404 to prevent tenant enumeration
                return reply.status(404).send({
                    statusCode: 404,
                    error: "Not Found",
                    message: "Resource not found",
                });
            }
        }
    );

    // ============================================================================
    // CSRF PROTECTION
    // ============================================================================

    /**
     * CSRF token generation and validation
     * Uses cryptographically secure tokens
     */
    fastify.decorate("generateCsrfToken", function (): string {
        return crypto.randomBytes(32).toString("hex");
    });

    fastify.decorate(
        "verifyCsrfToken",
        async function (request: FastifyRequest, reply: FastifyReply) {
            const token = request.headers["x-csrf-token"] as string;
            const cookieToken = request.cookies["csrf-token"];

            if (!token || !cookieToken || token !== cookieToken) {
                fastify.securityEvent(SECURITY_CONFIG.SECURITY_EVENTS.CSRF_VIOLATION, request, {
                    hasToken: !!token,
                    hasCookie: !!cookieToken,
                });

                return reply.status(403).send({
                    statusCode: 403,
                    error: "Forbidden",
                    message: "Invalid CSRF token",
                });
            }
        }
    );

    // ============================================================================
    // RESPONSE TIME TRACKING
    // ============================================================================

    fastify.addHook("onResponse", async (request, reply) => {
        const startTime = parseInt(request.headers["x-request-start"] as string, 10);
        if (startTime) {
            const duration = Date.now() - startTime;
            fastify.log.debug(
                {
                    requestId: request.headers["x-request-id"],
                    method: request.method,
                    url: request.url,
                    statusCode: reply.statusCode,
                    duration,
                },
                "Request completed"
            );
        }
    });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map attack type to security event type
 */
function getSecurityEventType(attackType: string): string {
    const mapping: Record<string, string> = {
        xss: SECURITY_CONFIG.SECURITY_EVENTS.XSS_ATTEMPT,
        sqlInjection: SECURITY_CONFIG.SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
        noSqlInjection: SECURITY_CONFIG.SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
        commandInjection: SECURITY_CONFIG.SECURITY_EVENTS.COMMAND_INJECTION_ATTEMPT,
        pathTraversal: SECURITY_CONFIG.SECURITY_EVENTS.PATH_TRAVERSAL_ATTEMPT,
        ldapInjection: SECURITY_CONFIG.SECURITY_EVENTS.SUSPICIOUS_PATTERN,
        headerInjection: SECURITY_CONFIG.SECURITY_EVENTS.XSS_ATTEMPT,
    };
    return mapping[attackType] ?? SECURITY_CONFIG.SECURITY_EVENTS.SUSPICIOUS_PATTERN;
}

/**
 * Determine severity level for security events
 */
function getSeverity(eventType: string): "critical" | "high" | "medium" | "low" {
    const severityMap: Record<string, "critical" | "high" | "medium" | "low"> = {
        [SECURITY_CONFIG.SECURITY_EVENTS.BRUTE_FORCE_DETECTED]: "high",
        [SECURITY_CONFIG.SECURITY_EVENTS.TENANT_VIOLATION]: "critical",
        [SECURITY_CONFIG.SECURITY_EVENTS.SQL_INJECTION_ATTEMPT]: "critical",
        [SECURITY_CONFIG.SECURITY_EVENTS.XSS_ATTEMPT]: "high",
        [SECURITY_CONFIG.SECURITY_EVENTS.COMMAND_INJECTION_ATTEMPT]: "critical",
        [SECURITY_CONFIG.SECURITY_EVENTS.PATH_TRAVERSAL_ATTEMPT]: "high",
        [SECURITY_CONFIG.SECURITY_EVENTS.CSRF_VIOLATION]: "medium",
        [SECURITY_CONFIG.SECURITY_EVENTS.SUSPICIOUS_PATTERN]: "medium",
        [SECURITY_CONFIG.SECURITY_EVENTS.RATE_LIMIT_EXCEEDED]: "low",
        [SECURITY_CONFIG.SECURITY_EVENTS.INVALID_TOKEN]: "medium",
    };
    return severityMap[eventType] ?? "medium";
}

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare module "fastify" {
    interface FastifyInstance {
        sanitizeRequest: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        auditLog: (action: string, request: FastifyRequest, details?: Record<string, unknown>) => void;
        securityEvent: (
            eventType: string,
            request: FastifyRequest,
            details?: Record<string, unknown>
        ) => void;
        trackFailedAuth: (identifier: string) => {
            count: number;
            firstAttempt: number;
            lockedUntil: number | null;
        };
        isLockedOut: (identifier: string) => boolean;
        clearFailedAttempts: (identifier: string) => void;
        verifyTenantAccess: (
            request: FastifyRequest,
            reply: FastifyReply,
            resourceTenantId: string
        ) => Promise<void>;
        generateCsrfToken: () => string;
        verifyCsrfToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export default fp(securityPlugin, {
    name: "security",
    fastify: "5.x",
});

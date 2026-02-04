/**
 * Environment variable type declarations for TypeScript
 * This ensures process.env properties are typed and ESLint doesn't report
 * "Unsafe member access" errors.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // Application
    NODE_ENV: "development" | "test" | "production";
    TZ?: string;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace";

    // Server
    PORT?: string;
    HOST?: string;
    API_VERSION?: string;

    // Database
    DATABASE_URL: string;
    DATABASE_POOL_MIN?: string;
    DATABASE_POOL_MAX?: string;

    // Redis
    REDIS_URL: string;
    REDIS_PASSWORD?: string;
    REDIS_DB?: string;

    // JWT
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ISSUER?: string;
    JWT_AUDIENCE?: string;
    ACCESS_TOKEN_EXPIRES_IN?: string;
    REFRESH_TOKEN_EXPIRES_IN?: string;

    // Cookie
    COOKIE_SECURE?: string;
    COOKIE_SAME_SITE?: "strict" | "lax" | "none";
    COOKIE_DOMAIN?: string;
    COOKIE_HTTP_ONLY?: string;

    // CORS
    CORS_ORIGIN?: string;
    CORS_CREDENTIALS?: string;

    // Rate Limiting
    RATE_LIMIT_MAX?: string;
    RATE_LIMIT_WINDOW_MS?: string;

    // Observability
    METRICS_ENABLED?: string;
    METRICS_PORT?: string;
    OTEL_ENABLED?: string;
    OTEL_EXPORTER_OTLP_ENDPOINT?: string;
    OTEL_SERVICE_NAME?: string;

    // Email
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    SMTP_FROM?: string;

    // Storage
    STORAGE_TYPE?: "local" | "s3";
    STORAGE_PATH?: string;
    S3_ENDPOINT?: string;
    S3_REGION?: string;
    S3_ACCESS_KEY?: string;
    S3_SECRET_KEY?: string;
    S3_BUCKET?: string;

    // Sentry
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;

    // Feature Flags
    FEATURE_REALTIME_ENABLED?: string;
    FEATURE_NOTIFICATIONS_ENABLED?: string;
    FEATURE_ANALYTICS_ENABLED?: string;
  }
}

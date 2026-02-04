import { z } from "zod";

/**
 * Environment variable schema with validation
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TZ: z.string().default("UTC"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Server
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  HOST: z.string().default("0.0.0.0"),
  API_VERSION: z.string().default("v1"),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), {
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
    }),
  DATABASE_POOL_MIN: z.coerce.number().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().min(1).default(10),

  // Redis
  REDIS_URL: z.string().refine((url) => url.startsWith("redis://") || url.startsWith("rediss://"), {
    message: "REDIS_URL must be a valid Redis connection string",
  }),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ISSUER: z.string().default("washwise-api"),
  JWT_AUDIENCE: z.string().default("washwise-client"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  // Cookie
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),

  // CORS
  CORS_ORIGIN: z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim()))
    .default("http://localhost:3000"),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(60000),

  // Observability
  METRICS_ENABLED: z.coerce.boolean().default(false),
  METRICS_PORT: z.coerce.number().min(1).max(65535).default(9090),
  OTEL_ENABLED: z.coerce.boolean().default(false),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default("washwise-api"),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Storage (optional)
  STORAGE_TYPE: z.enum(["local", "s3"]).default("local"),
  STORAGE_PATH: z.string().default("./uploads"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Feature Flags
  FEATURE_REALTIME_ENABLED: z.coerce.boolean().default(true),
  FEATURE_NOTIFICATIONS_ENABLED: z.coerce.boolean().default(true),
  FEATURE_ANALYTICS_ENABLED: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * @throws {Error} If validation fails with detailed error messages
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `  - ${err.path.join(".")}: ${err.message}`);

    console.error("\n❌ Environment validation failed:\n");
    console.error(errors.join("\n"));
    console.error("\n📝 Please check your .env file and ensure all required variables are set.\n");
    console.error("💡 Tip: Copy .env.template to .env and fill in your values.\n");

    throw new Error("Environment validation failed");
  }

  return result.data;
}

/**
 * Get validated environment (cached)
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === "test";
}

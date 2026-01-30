import { z } from "zod";

// Environment configuration schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // JWT Secrets (minimum 32 characters for security)
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Token expiration
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Cookie settings
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Parse and validate environment
export function parseEnv(env: NodeJS.ProcessEnv): EnvConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

// Constants
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_SECONDS: 15 * 60, // 15 minutes
  REFRESH_TOKEN_EXPIRES_SECONDS: 7 * 24 * 60 * 60, // 7 days
  REFRESH_COOKIE_NAME: "washwise_refresh_token",
  BCRYPT_ROUNDS: 12,
} as const;

export const API_CONSTANTS = {
  PREFIX: "/api/v1",
  RATE_LIMIT: {
    MAX: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

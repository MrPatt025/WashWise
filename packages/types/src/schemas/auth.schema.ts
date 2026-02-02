import { z } from "zod";

// ============================================
// Authentication Schemas
// ============================================

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z
    .string()
    .min(1, "Laundromat slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  tenantName: z.string().min(2).max(100),
  tenantSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  phone: z.string().max(20).optional(),
});

export const TokenPayloadSchema = z.object({
  sub: z.string().uuid(), // User ID
  email: z.string().email(),
  role: z.string(),
  tenantId: z.string().uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(), // HttpOnly cookie preferred, but included for API testing
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string().optional(),
    role: z.string(),
    status: z.string().optional(),
    emailVerified: z.boolean().optional(),
    lastLoginAt: z.string().optional(),
    tenant: z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }),
    createdAt: z.string().optional(),
  }),
});

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

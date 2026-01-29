import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(2).max(100),
    tenantName: z.string().min(2).max(100),
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
    user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.string(),
        tenantId: z.string().uuid(),
        tenantName: z.string(),
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

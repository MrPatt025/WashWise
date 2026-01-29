import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

export const UserRoleSchema = z.enum(['ADMIN', 'MANAGER', 'STAFF']);

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(2).max(100),
    role: UserRoleSchema,
    tenantId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const UserPublicSchema = UserSchema.omit({
    createdAt: true,
    updatedAt: true,
});

export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(2).max(100),
    role: UserRoleSchema.optional().default('STAFF'),
});

export const UpdateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    role: UserRoleSchema.optional(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserPublic = z.infer<typeof UserPublicSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

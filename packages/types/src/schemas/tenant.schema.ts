import { z } from 'zod';

// ============================================
// Tenant Schemas
// ============================================

export const TenantPlanSchema = z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']);

export const TenantSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    plan: TenantPlanSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const CreateTenantSchema = z.object({
    name: z.string().min(2).max(100),
    plan: TenantPlanSchema.optional().default('FREE'),
});

export type TenantPlan = z.infer<typeof TenantPlanSchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;

import { z } from 'zod';

// ============================================
// Machine Schemas
// ============================================

export const MachineTypeSchema = z.enum(['WASHER', 'DRYER']);

export const MachineStatusSchema = z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE']);

export const MachineSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    serialNumber: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    type: MachineTypeSchema,
    capacityKg: z.number().positive().max(100),
    status: MachineStatusSchema,
    pricePerCycle: z.number().nonnegative(),
    location: z.string().max(200).optional().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const MachinePublicSchema = MachineSchema.omit({
    tenantId: true,
});

export const CreateMachineSchema = z.object({
    serialNumber: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    type: MachineTypeSchema,
    capacityKg: z.number().positive().max(100),
    pricePerCycle: z.number().nonnegative(),
    location: z.string().max(200).optional(),
});

export const UpdateMachineSchema = z.object({
    label: z.string().min(1).max(100).optional(),
    status: MachineStatusSchema.optional(),
    pricePerCycle: z.number().nonnegative().optional(),
    location: z.string().max(200).optional().nullable(),
});

export const MachineQuerySchema = z.object({
    type: MachineTypeSchema.optional(),
    status: MachineStatusSchema.optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
});

export type MachineType = z.infer<typeof MachineTypeSchema>;
export type MachineStatus = z.infer<typeof MachineStatusSchema>;
export type Machine = z.infer<typeof MachineSchema>;
export type MachinePublic = z.infer<typeof MachinePublicSchema>;
export type CreateMachine = z.infer<typeof CreateMachineSchema>;
export type UpdateMachine = z.infer<typeof UpdateMachineSchema>;
export type MachineQuery = z.infer<typeof MachineQuerySchema>;

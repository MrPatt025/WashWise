import { z } from "zod";

// ============================================
// IoT Log Schemas
// ============================================

export const IoTLogSchema = z.object({
    id: z.string().uuid(),
    machineId: z.string().uuid(),
    event: z.string(),
    payload: z.record(z.unknown()).nullable().optional(),
    timestamp: z.date(),
});

export const CreateIoTLogSchema = z.object({
    machineId: z.string().uuid(),
    event: z.string(),
    payload: z.record(z.unknown()).nullable().optional(),
});

export type IoTLog = z.infer<typeof IoTLogSchema>;
export type CreateIoTLog = z.infer<typeof CreateIoTLogSchema>;

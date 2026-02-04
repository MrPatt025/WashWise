import { z } from "zod";

// ============================================
// Machine Schemas
// ============================================

export const MachineTypeSchema = z.enum(["WASHER", "DRYER"]);

// Backend MachineStatus enum - MUST match Java MachineStatus.java
export const MachineStatusSchema = z.enum([
  "IDLE", // Available for booking
  "RESERVED", // Reserved but not in use
  "RUNNING", // Currently running
  "MAINTENANCE", // Under maintenance
  "OUT_OF_ORDER", // Out of order
  "ERROR", // Has an error
  "OFFLINE", // Not communicating
  "DISABLED", // Inactive
]);

// UI-friendly status mapping for display
export const STATUS_DISPLAY_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" | "default" }
> = {
  IDLE: { label: "Available", variant: "success" },
  RESERVED: { label: "Reserved", variant: "warning" },
  RUNNING: { label: "In Use", variant: "warning" },
  MAINTENANCE: { label: "Maintenance", variant: "destructive" },
  OUT_OF_ORDER: { label: "Out of Order", variant: "destructive" },
  ERROR: { label: "Error", variant: "destructive" },
  OFFLINE: { label: "Offline", variant: "outline" },
  DISABLED: { label: "Disabled", variant: "outline" },
};

export const MachineSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  name: z.string(),
  machineNumber: z.string().nullable().optional(),
  type: MachineTypeSchema,
  status: MachineStatusSchema,
  capacityKg: z.number().nullable().optional(),
  pricePerCycle: z.number(),
  cycleDurationMinutes: z.number().nullable().optional(),
  model: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  iotDeviceId: z.string().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Legacy field aliases for backward compatibility
  label: z.string().optional(), // alias for name
});

export const MachinePublicSchema = MachineSchema.omit({
  tenantId: true,
});

export const CreateMachineSchema = z.object({
  name: z.string().min(1, "Machine name is required").max(50),
  machineNumber: z.string().max(20).optional(),
  type: MachineTypeSchema,
  capacityKg: z.number().positive().max(100).optional(),
  pricePerCycle: z.number().positive("Price must be greater than 0"),
  cycleDurationMinutes: z.number().int().min(1).max(240).optional(),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  iotDeviceId: z.string().max(100).optional(),
  branchId: z.string().uuid("Branch is required"),
});

export const UpdateMachineSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  machineNumber: z.string().max(20).optional(),
  type: MachineTypeSchema.optional(),
  capacityKg: z.number().positive().max(100).optional(),
  pricePerCycle: z.number().positive().optional(),
  cycleDurationMinutes: z.number().int().min(1).max(240).optional(),
  model: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  iotDeviceId: z.string().max(100).optional(),
});

export const MachineQuerySchema = z.object({
  type: MachineTypeSchema.optional(),
  status: MachineStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
});

// Backend stats response - matches MachineService.MachineStats
export const MachineStatsSchema = z.object({
  total: z.number(),
  idle: z.number(), // Backend: IDLE status
  inUse: z.number(), // Backend: RUNNING status
  error: z.number(), // Backend: ERROR status
  maintenance: z.number(),
});

export type MachineType = z.infer<typeof MachineTypeSchema>;
export type MachineStatus = z.infer<typeof MachineStatusSchema>;
export type Machine = z.infer<typeof MachineSchema>;
export type MachinePublic = z.infer<typeof MachinePublicSchema>;
export type CreateMachine = z.infer<typeof CreateMachineSchema>;
export type UpdateMachine = z.infer<typeof UpdateMachineSchema>;
export type MachineQuery = z.infer<typeof MachineQuerySchema>;
export type MachineStats = z.infer<typeof MachineStatsSchema>;

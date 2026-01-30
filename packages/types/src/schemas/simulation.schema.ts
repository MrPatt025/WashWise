import { z } from "zod";
import { MachineStatusSchema } from "./machine.schema.js";

// ============================================
// IoT Simulation Schemas
// ============================================

export const SimulationEventSchema = z.object({
  machineId: z.string().uuid(),
  status: MachineStatusSchema,
});

export const MachineUpdateEventSchema = z.object({
  machineId: z.string().uuid(),
  status: z.string(),
  updatedAt: z.string().datetime(),
});

export const TelemetryDataSchema = z.object({
  machineId: z.string().uuid(),
  temperature: z.number().optional(),
  vibration: z.number().optional(),
  waterLevel: z.number().optional(),
  cycleProgress: z.number().min(0).max(100).optional(),
  errorCode: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type SimulationEvent = z.infer<typeof SimulationEventSchema>;
export type MachineUpdateEvent = z.infer<typeof MachineUpdateEventSchema>;
export type TelemetryData = z.infer<typeof TelemetryDataSchema>;

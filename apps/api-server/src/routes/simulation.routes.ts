import type { FastifyInstance, FastifyRequest } from "fastify";
import { type SimulationEvent, SimulationEventSchema } from "@washwise/types";
import { MachineService } from "../services/machine.service.js";

// Helper to safely get tenantId from authenticated request
function getTenantId(request: FastifyRequest): string {
  if (!request.user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return request.user.tenantId;
}

/**
 * IoT Simulation routes
 * Simulates machine status updates for testing real-time features
 */
export async function simulationRoutes(fastify: FastifyInstance) {
  const machineService = new MachineService();

  // Apply authentication to all routes
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.ensureTenant);

  /**
   * POST /simulation/event
   * Simulate a machine status change event
   * Validates ownership and broadcasts to tenant room
   */
  fastify.post<{ Body: SimulationEvent }>(
    "/event",
    {
      schema: {
        description: "Simulate a machine status update event",
        tags: ["Simulation"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["machineId", "status"],
          properties: {
            machineId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: [
                "IDLE",
                "RESERVED",
                "RUNNING",
                "MAINTENANCE",
                "OUT_OF_ORDER",
                "ERROR",
                "OFFLINE",
                "DISABLED",
              ],
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = SimulationEventSchema.parse(request.body);
      const tenantId = getTenantId(request);

      // Update machine status (validates tenant ownership)
      const machine = await machineService.updateStatus(tenantId, data.machineId, data.status);

      if (!machine) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Machine not found",
        });
      }

      // Broadcast update to tenant room only
      const roomName = `tenant:${tenantId}`;
      fastify.io?.to(roomName).emit("machine:update", {
        machineId: machine.id,
        status: machine.status,
        updatedAt: machine.updatedAt,
      });

      fastify.log.info({
        event: "MACHINE_STATUS_BROADCAST",
        machineId: machine.id,
        status: machine.status,
        room: roomName,
      });

      return reply.send({
        success: true,
        machine: {
          id: machine.id,
          status: machine.status,
          updatedAt: machine.updatedAt,
        },
      });
    }
  );

  /**
   * POST /simulation/telemetry
   * Simulate telemetry data from a machine
   */
  fastify.post<{
    Body: {
      machineId: string;
      temperature?: number;
      vibration?: number;
      waterLevel?: number;
      cycleProgress?: number;
    };
  }>(
    "/telemetry",
    {
      schema: {
        description: "Simulate machine telemetry data",
        tags: ["Simulation"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["machineId"],
          properties: {
            machineId: { type: "string", format: "uuid" },
            temperature: { type: "number" },
            vibration: { type: "number" },
            waterLevel: { type: "number" },
            cycleProgress: { type: "number", minimum: 0, maximum: 100 },
          },
        },
      },
    },
    async (request, reply) => {
      const { machineId, ...telemetry } = request.body;
      const tenantId = getTenantId(request);

      // Verify machine ownership
      const machine = await machineService.getById(tenantId, machineId);

      if (!machine) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Machine not found",
        });
      }

      // Broadcast telemetry to tenant room
      const roomName = `tenant:${tenantId}`;
      fastify.io?.to(roomName).emit("machine:telemetry", {
        machineId,
        ...telemetry,
        timestamp: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        message: "Telemetry broadcast sent",
      });
    }
  );
}

export default simulationRoutes;

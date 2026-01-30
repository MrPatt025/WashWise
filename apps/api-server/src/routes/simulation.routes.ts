import type { FastifyInstance } from "fastify";
import { SimulationEventSchema, type SimulationEvent } from "@washwise/types";
import { MachineService } from "../services/machine.service.js";

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
              enum: ["AVAILABLE", "BUSY", "OFFLINE", "MAINTENANCE"],
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = SimulationEventSchema.parse(request.body);
      const tenantId = request.user!.tenantId;

      // Update machine status (validates tenant ownership)
      const machine = await machineService.updateStatus(
        tenantId,
        data.machineId,
        data.status,
      );

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
        updatedAt: machine.updatedAt.toISOString(),
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
    },
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
      const tenantId = request.user!.tenantId;

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
    },
  );
}

export default simulationRoutes;

import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  type CreateMachine,
  CreateMachineSchema,
  IdParamSchema,
  type MachineQuery,
  MachineQuerySchema,
  type UpdateMachine,
  UpdateMachineSchema,
} from "@washwise/types";
import { MachineService } from "../services/machine.service.js";

// Helper to safely get tenantId from authenticated request
function getTenantId(request: FastifyRequest): string {
  if (!request.user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return request.user.tenantId;
}

/**
 * Machine management routes
 * SECURITY: All routes require authentication and enforce tenant isolation
 */
export async function machineRoutes(fastify: FastifyInstance) {
  const machineService = new MachineService();

  // Apply authentication to all routes in this plugin
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.ensureTenant);

  /**
   * GET /machines
   * List all machines for the tenant
   */
  fastify.get<{ Querystring: MachineQuery }>(
    "/",
    {
      schema: {
        description: "List machines with pagination and filtering",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["WASHER", "DRYER"] },
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
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1, maximum: 100 },
            search: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const query = MachineQuerySchema.parse(request.query);
      const result = await machineService.list(tenantId, query);
      return reply.send(result);
    }
  );

  /**
   * GET /machines/stats
   * Get machine statistics for dashboard
   */
  fastify.get(
    "/stats",
    {
      schema: {
        description: "Get machine statistics",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const stats = await machineService.getStats(tenantId);
      return reply.send(stats);
    }
  );

  /**
   * GET /machines/:id
   * Get a single machine by ID
   * ANTI-IDOR: Returns 404 for both not found and wrong tenant
   */
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        description: "Get machine by ID",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = IdParamSchema.parse(request.params);
      const machine = await machineService.getById(tenantId, id);

      if (!machine) {
        // ANTI-IDOR: Return 404 for both not found AND wrong tenant
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Machine not found",
        });
      }

      return reply.send(machine);
    }
  );

  /**
   * POST /machines
   * Create a new machine
   */
  fastify.post<{ Body: CreateMachine & { branchId: string } }>(
    "/",
    {
      preHandler: [fastify.requireRole(["SUPER_ADMIN", "OWNER"])],
      schema: {
        description: "Create a new machine",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "type", "pricePerCycle", "branchId"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            machineNumber: { type: "string", maxLength: 20 },
            type: { type: "string", enum: ["WASHER", "DRYER"] },
            capacityKg: { type: "number", minimum: 0 },
            pricePerCycle: { type: "number", minimum: 0 },
            cycleDurationMinutes: { type: "number", minimum: 1, maximum: 240 },
            manufacturer: { type: "string", maxLength: 100 },
            model: { type: "string", maxLength: 100 },
            serialNumber: { type: "string", maxLength: 100 },
            iotDeviceId: { type: "string", maxLength: 100 },
            branchId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const data = CreateMachineSchema.parse(request.body);

      try {
        const machine = await machineService.create(tenantId, data);
        return reply.status(201).send(machine);
      } catch (error) {
        if (error instanceof Error && error.message.includes("already exists")) {
          return reply.status(409).send({
            statusCode: 409,
            error: "Conflict",
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  /**
   * PATCH /machines/:id
   * Update a machine
   */
  fastify.patch<{ Params: { id: string }; Body: UpdateMachine }>(
    "/:id",
    {
      preHandler: [fastify.requireRole(["SUPER_ADMIN", "OWNER"])],
      schema: {
        description: "Update a machine",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            label: { type: "string", minLength: 1, maxLength: 100 },
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
            pricePerCycle: { type: "number", minimum: 0 },
            location: { type: "string", maxLength: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = IdParamSchema.parse(request.params);
      const data = UpdateMachineSchema.parse(request.body);

      const machine = await machineService.update(tenantId, id, data);

      if (!machine) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Machine not found",
        });
      }

      return reply.send(machine);
    }
  );

  /**
   * DELETE /machines/:id
   * Delete a machine
   */
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      preHandler: [fastify.requireRole(["SUPER_ADMIN", "OWNER"])],
      schema: {
        description: "Delete a machine",
        tags: ["Machines"],
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { id } = IdParamSchema.parse(request.params);

      const deleted = await machineService.delete(tenantId, id);

      if (!deleted) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Machine not found",
        });
      }

      return reply.status(204).send();
    }
  );
}

export default machineRoutes;

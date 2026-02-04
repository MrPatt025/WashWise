import type { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "@washwise/database";

// Helper to safely get tenantId from authenticated request
function getTenantId(request: FastifyRequest): string {
  if (!request.user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return request.user.tenantId;
}

/**
 * Branch management routes
 * SECURITY: All routes require authentication and enforce tenant isolation
 */
export async function branchRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes in this plugin
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.ensureTenant);

  /**
   * GET /branches
   * List all branches for the tenant
   */
  fastify.get(
    "/",
    {
      schema: {
        description: "List branches for the tenant",
        tags: ["Branches"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const branches = await prisma.branch.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
        },
      });

      return reply.send(branches);
    }
  );
}

export default branchRoutes;

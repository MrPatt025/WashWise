import type { FastifyInstance, FastifyRequest } from "fastify";
import { AnalyticsService } from "../services/analytics.service.js";

// Helper to safely get tenantId from authenticated request
function getTenantId(request: FastifyRequest): string {
  if (!request.user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return request.user.tenantId;
}

/**
 * Analytics routes for comprehensive business intelligence
 * SECURITY: All routes require authentication and enforce tenant isolation
 */
export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService();

  // Apply authentication to all routes in this plugin
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", fastify.ensureTenant);

  /**
   * GET /analytics/dashboard
   * Get comprehensive dashboard analytics
   */
  fastify.get(
    "/dashboard",
    {
      schema: {
        description:
          "Get comprehensive dashboard analytics including machine stats, utilization, revenue, and performance metrics",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              machineStats: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  byStatus: {
                    type: "object",
                    properties: {
                      idle: { type: "number" },
                      running: { type: "number" },
                      maintenance: { type: "number" },
                      error: { type: "number" },
                      offline: { type: "number" },
                    },
                  },
                  byType: {
                    type: "object",
                    properties: {
                      washer: { type: "number" },
                      dryer: { type: "number" },
                    },
                  },
                  healthScore: { type: "number" },
                },
              },
              utilizationMetrics: {
                type: "object",
                properties: {
                  currentUtilization: { type: "number" },
                  avgCyclesPerMachine: { type: "number" },
                  peakHours: { type: "array", items: { type: "string" } },
                  recentlyUsedCount: { type: "number" },
                  idleCount: { type: "number" },
                  utilizationTrend: { type: "string", enum: ["up", "down", "stable"] },
                },
              },
              revenueMetrics: {
                type: "object",
                properties: {
                  totalRevenue: { type: "number" },
                  totalCycles: { type: "number" },
                  avgRevenuePerCycle: { type: "number" },
                  dailyAverage: { type: "number" },
                  weeklyBreakdown: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        revenue: { type: "number" },
                      },
                    },
                  },
                  revenueTrend: { type: "string", enum: ["up", "down", "stable"] },
                },
              },
              performanceMetrics: {
                type: "object",
                properties: {
                  uptime: { type: "number" },
                  errorRate: { type: "number" },
                  mtbf: { type: "number" },
                  needsMaintenanceCount: { type: "number" },
                  totalErrors: { type: "number" },
                  performanceTrend: { type: "string", enum: ["up", "down", "stable"] },
                },
              },
              generatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const analytics = await analyticsService.getDashboardAnalytics(tenantId);
      return reply.send(analytics);
    }
  );

  /**
   * GET /analytics/machines/stats
   * Get machine statistics
   */
  fastify.get(
    "/machines/stats",
    {
      schema: {
        description: "Get detailed machine statistics",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const stats = await analyticsService.getMachineStats(tenantId);
      return reply.send(stats);
    }
  );

  /**
   * GET /analytics/utilization
   * Get utilization metrics
   */
  fastify.get(
    "/utilization",
    {
      schema: {
        description: "Get machine utilization metrics",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const metrics = await analyticsService.getUtilizationMetrics(tenantId);
      return reply.send(metrics);
    }
  );

  /**
   * GET /analytics/revenue
   * Get revenue metrics
   */
  fastify.get(
    "/revenue",
    {
      schema: {
        description: "Get revenue analytics and metrics",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const metrics = await analyticsService.getRevenueMetrics(tenantId);
      return reply.send(metrics);
    }
  );

  /**
   * GET /analytics/performance
   * Get performance metrics
   */
  fastify.get(
    "/performance",
    {
      schema: {
        description: "Get machine performance metrics including uptime and error rates",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const metrics = await analyticsService.getPerformanceMetrics(tenantId);
      return reply.send(metrics);
    }
  );

  /**
   * GET /analytics/machines/rankings
   * Get machine rankings by various metrics
   */
  fastify.get<{
    Querystring: { sortBy?: "revenue" | "cycles" | "errors"; limit?: number };
  }>(
    "/machines/rankings",
    {
      schema: {
        description: "Get machine rankings sorted by revenue, cycles, or errors",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            sortBy: { type: "string", enum: ["revenue", "cycles", "errors"], default: "revenue" },
            limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const { sortBy = "revenue", limit = 10 } = request.query;
      const rankings = await analyticsService.getMachineRankings(tenantId, sortBy, limit);
      return reply.send(rankings);
    }
  );

  /**
   * GET /analytics/usage-pattern
   * Get hourly usage pattern
   */
  fastify.get(
    "/usage-pattern",
    {
      schema: {
        description: "Get hourly usage patterns showing peak usage times",
        tags: ["Analytics"],
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const pattern = await analyticsService.getUsagePattern(tenantId);
      return reply.send(pattern);
    }
  );
}

export default analyticsRoutes;

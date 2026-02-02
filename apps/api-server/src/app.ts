import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodError } from "zod";
import { API_CONSTANTS } from "@washwise/config";
import type { Server as SocketIOServer } from "socket.io";

import { env } from "./config/index.js";
import { authPlugin, zodPlugin } from "./plugins/index.js";
import { authRoutes, machineRoutes, simulationRoutes } from "./routes/index.js";

// Extend Fastify types for Socket.io
declare module "fastify" {
  interface FastifyInstance {
    io?: SocketIOServer;
  }
}

/**
 * Build Fastify application with all plugins and routes
 */
export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
    trustProxy: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disabled for API
  });

  // CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Cookie parsing
  await fastify.register(cookie, {
    secret: env.JWT_ACCESS_SECRET,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: API_CONSTANTS.RATE_LIMIT.MAX,
    timeWindow: API_CONSTANTS.RATE_LIMIT.WINDOW_MS,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "WashWise API",
        description: "Smart Laundromat Management Platform API",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Machines", description: "Machine management endpoints" },
        { name: "Simulation", description: "IoT simulation endpoints" },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // Custom plugins
  await fastify.register(zodPlugin);
  await fastify.register(authPlugin);

  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }));

  // API routes
  await fastify.register(authRoutes, {
    prefix: `${API_CONSTANTS.PREFIX}/auth`,
  });
  await fastify.register(machineRoutes, {
    prefix: `${API_CONSTANTS.PREFIX}/machines`,
  });

  // Simulation routes (will use fastify.io if available)
  await fastify.register(simulationRoutes, {
    prefix: `${API_CONSTANTS.PREFIX}/simulation`,
  });

  // Global error handler
  fastify.setErrorHandler(
    (error: Error & { validation?: unknown; statusCode?: number }, _request, reply) => {
      fastify.log.error(error);

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Validation Error",
          message: "Request validation failed",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }

      // Handle Fastify validation errors
      if (error.validation) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Validation Error",
          message: error.message,
        });
      }

      // Default error response
      const statusCode = error.statusCode || 500;
      return reply.status(statusCode).send({
        statusCode,
        error: error.name || "Internal Server Error",
        message: env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message,
      });
    }
  );

  return fastify;
}

export default buildApp;

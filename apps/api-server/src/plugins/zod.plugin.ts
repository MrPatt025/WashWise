import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { ZodSchema } from "zod";

/**
 * Zod validation plugin for Fastify
 * Provides schema validation for body, query, and params
 */
async function zodPlugin(fastify: FastifyInstance) {
  /**
   * Validation decorator factory
   */
  fastify.decorate("zodValidate", function <T>(schema: ZodSchema<T>) {
    return {
      body: (data: unknown): T => schema.parse(data),
      query: (data: unknown): T => schema.parse(data),
      params: (data: unknown): T => schema.parse(data),
    };
  });
}

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    zodValidate: <T>(schema: ZodSchema<T>) => {
      body: (data: unknown) => T;
      query: (data: unknown) => T;
      params: (data: unknown) => T;
    };
  }
}

export default fp(zodPlugin, {
  name: "zod-plugin",
});

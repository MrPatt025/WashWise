import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError, ZodSchema } from 'zod';

/**
 * Zod validation plugin for Fastify
 * Provides schema validation for body, query, and params
 */
async function zodPlugin(fastify: FastifyInstance) {
    // Global error handler for Zod validation errors
    fastify.setErrorHandler(
        (error: Error | ZodError, _request: FastifyRequest, reply: FastifyReply) => {
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Validation Error',
                    message: 'Request validation failed',
                    details: error.errors.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }

            // Re-throw other errors to be handled by default handler
            throw error;
        }
    );

    /**
     * Validation decorator factory
     */
    fastify.decorate('zodValidate', function <T>(schema: ZodSchema<T>) {
        return {
            body: (data: unknown): T => schema.parse(data),
            query: (data: unknown): T => schema.parse(data),
            params: (data: unknown): T => schema.parse(data),
        };
    });
}

// Extend Fastify types
declare module 'fastify' {
    interface FastifyInstance {
        zodValidate: <T>(schema: ZodSchema<T>) => {
            body: (data: unknown) => T;
            query: (data: unknown) => T;
            params: (data: unknown) => T;
        };
    }
}

export default fp(zodPlugin, {
    name: 'zod-plugin',
});

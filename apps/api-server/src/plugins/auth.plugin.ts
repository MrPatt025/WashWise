import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import type { TokenPayload, RequestContext } from '@washwise/types';
import env from '../config/env.js';

// Extend Fastify request with user context
declare module 'fastify' {
    interface FastifyRequest {
        user?: RequestContext;
    }
}

/**
 * Authentication plugin - JWT verification and tenant context injection
 * SECURITY: Extracts tenantId from JWT and injects into request context
 */
async function authPlugin(fastify: FastifyInstance) {
    // Decorator for user context
    fastify.decorateRequest('user', null);

    /**
     * Middleware to verify JWT and inject user context
     * Use as preHandler on protected routes
     */
    fastify.decorate(
        'authenticate',
        async function (request: FastifyRequest, reply: FastifyReply) {
            const authHeader = request.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Missing or invalid authorization header',
                });
            }

            const token = authHeader.substring(7);

            try {
                const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

                // Inject user context with tenantId for IDOR protection
                request.user = {
                    userId: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    tenantId: payload.tenantId,
                };
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    return reply.status(401).send({
                        statusCode: 401,
                        error: 'Unauthorized',
                        message: 'Access token expired',
                    });
                }

                return reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Invalid access token',
                });
            }
        }
    );

    /**
     * Middleware to ensure tenant context exists
     * ANTI-IDOR: Every protected route MUST have tenantId
     */
    fastify.decorate(
        'ensureTenant',
        async function (request: FastifyRequest, reply: FastifyReply) {
            if (!request.user?.tenantId) {
                return reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Tenant context required',
                });
            }
        }
    );

    /**
     * Role-based access control middleware factory
     */
    fastify.decorate('requireRole', function (allowedRoles: string[]) {
        return async function (request: FastifyRequest, reply: FastifyReply) {
            if (!request.user) {
                return reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
            }

            if (!allowedRoles.includes(request.user.role)) {
                return reply.status(403).send({
                    statusCode: 403,
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                });
            }
        };
    });
}

// Extend Fastify with our custom decorators
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        ensureTenant: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireRole: (
            allowedRoles: string[]
        ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export default fp(authPlugin, {
    name: 'auth-plugin',
});

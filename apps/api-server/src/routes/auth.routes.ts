import type { FastifyInstance } from 'fastify';
import { AUTH_CONSTANTS } from '@washwise/config';
import {
    LoginRequestSchema,
    RegisterRequestSchema,
    type LoginRequest,
    type RegisterRequest,
} from '@washwise/types';
import { AuthService } from '../services/auth.service.js';
import env from '../config/env.js';

/**
 * Authentication routes
 * Implements secure dual-token authentication with rotation
 */
export async function authRoutes(fastify: FastifyInstance) {
    const authService = new AuthService();

    /**
     * POST /auth/register
     * Register a new user and tenant
     */
    fastify.post<{ Body: RegisterRequest }>(
        '/register',
        {
            schema: {
                description: 'Register a new user and create a tenant',
                tags: ['Auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password', 'name', 'tenantName'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        name: { type: 'string', minLength: 2 },
                        tenantName: { type: 'string', minLength: 2 },
                    },
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            accessToken: { type: 'string' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    email: { type: 'string' },
                                    name: { type: 'string' },
                                    role: { type: 'string' },
                                    tenantId: { type: 'string' },
                                    tenantName: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const data = RegisterRequestSchema.parse(request.body);

            try {
                const result = await authService.register(data);
                return reply.status(201).send(result);
            } catch (error) {
                if (error instanceof Error && error.message === 'Email already registered') {
                    return reply.status(409).send({
                        statusCode: 409,
                        error: 'Conflict',
                        message: error.message,
                    });
                }
                throw error;
            }
        }
    );

    /**
     * POST /auth/login
     * Login and receive access token + refresh token cookie
     */
    fastify.post<{ Body: LoginRequest }>(
        '/login',
        {
            schema: {
                description: 'Login with email and password',
                tags: ['Auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const data = LoginRequestSchema.parse(request.body);

            try {
                const { refreshToken, ...response } = await authService.login(data);

                // Set refresh token as HttpOnly cookie
                reply.setCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, refreshToken, {
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: 'strict',
                    path: '/api/v1/auth',
                    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_SECONDS,
                    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
                });

                return reply.send(response);
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid credentials') {
                    return reply.status(401).send({
                        statusCode: 401,
                        error: 'Unauthorized',
                        message: 'Invalid email or password',
                    });
                }
                throw error;
            }
        }
    );

    /**
     * POST /auth/refresh
     * Refresh access token using refresh token cookie
     * SECURITY: Implements token rotation and reuse detection
     */
    fastify.post(
        '/refresh',
        {
            schema: {
                description: 'Refresh access token',
                tags: ['Auth'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            accessToken: { type: 'string' },
                        },
                    },
                    401: {
                        type: 'object',
                        properties: {
                            statusCode: { type: 'number' },
                            error: { type: 'string' },
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const refreshToken = request.cookies[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];

            if (!refreshToken) {
                return reply.status(401).send({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'Refresh token not found',
                });
            }

            try {
                const tokens = await authService.refresh(refreshToken);

                // Set new refresh token cookie (rotation)
                reply.setCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, tokens.refreshToken, {
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: 'strict',
                    path: '/api/v1/auth',
                    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_SECONDS,
                    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
                });

                return reply.send({ accessToken: tokens.accessToken });
            } catch (error) {
                // Clear invalid refresh token cookie
                reply.clearCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, {
                    path: '/api/v1/auth',
                });

                if (error instanceof Error) {
                    if (error.message.includes('Token reuse detected')) {
                        // Security breach - log this event
                        fastify.log.warn({
                            event: 'TOKEN_REUSE_DETECTED',
                            ip: request.ip,
                            userAgent: request.headers['user-agent'],
                        });
                    }

                    return reply.status(401).send({
                        statusCode: 401,
                        error: 'Unauthorized',
                        message: error.message,
                    });
                }
                throw error;
            }
        }
    );

    /**
     * POST /auth/logout
     * Logout and revoke all tokens in the family
     */
    fastify.post(
        '/logout',
        {
            schema: {
                description: 'Logout and revoke refresh token',
                tags: ['Auth'],
            },
        },
        async (request, reply) => {
            const refreshToken = request.cookies[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];

            if (refreshToken) {
                await authService.logout(refreshToken);
            }

            // Clear refresh token cookie
            reply.clearCookie(AUTH_CONSTANTS.REFRESH_COOKIE_NAME, {
                path: '/api/v1/auth',
            });

            return reply.send({ success: true, message: 'Logged out successfully' });
        }
    );

    /**
     * GET /auth/me
     * Get current user info (requires authentication)
     */
    fastify.get(
        '/me',
        {
            preHandler: [fastify.authenticate],
            schema: {
                description: 'Get current user information',
                tags: ['Auth'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            return reply.send({
                user: request.user,
            });
        }
    );
}

export default authRoutes;

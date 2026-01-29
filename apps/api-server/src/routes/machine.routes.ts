import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
    CreateMachineSchema,
    UpdateMachineSchema,
    MachineQuerySchema,
    IdParamSchema,
    type CreateMachine,
    type UpdateMachine,
    type MachineQuery,
} from '@washwise/types';
import { MachineService } from '../services/machine.service.js';

/**
 * Machine management routes
 * SECURITY: All routes require authentication and enforce tenant isolation
 */
export async function machineRoutes(fastify: FastifyInstance) {
    const machineService = new MachineService();

    // Apply authentication to all routes in this plugin
    fastify.addHook('preHandler', fastify.authenticate);
    fastify.addHook('preHandler', fastify.ensureTenant);

    /**
     * GET /machines
     * List all machines for the tenant
     */
    fastify.get<{ Querystring: MachineQuery }>(
        '/',
        {
            schema: {
                description: 'List machines with pagination and filtering',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['WASHER', 'DRYER'] },
                        status: { type: 'string', enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE'] },
                        page: { type: 'number', minimum: 1 },
                        limit: { type: 'number', minimum: 1, maximum: 100 },
                        search: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const query = MachineQuerySchema.parse(request.query);
            const result = await machineService.list(request.user!.tenantId, query);
            return reply.send(result);
        }
    );

    /**
     * GET /machines/stats
     * Get machine statistics for dashboard
     */
    fastify.get(
        '/stats',
        {
            schema: {
                description: 'Get machine statistics',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const stats = await machineService.getStats(request.user!.tenantId);
            return reply.send(stats);
        }
    );

    /**
     * GET /machines/:id
     * Get a single machine by ID
     * ANTI-IDOR: Returns 404 for both not found and wrong tenant
     */
    fastify.get<{ Params: { id: string } }>(
        '/:id',
        {
            schema: {
                description: 'Get machine by ID',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = IdParamSchema.parse(request.params);
            const machine = await machineService.getById(request.user!.tenantId, id);

            if (!machine) {
                // ANTI-IDOR: Return 404 for both not found AND wrong tenant
                return reply.status(404).send({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Machine not found',
                });
            }

            return reply.send(machine);
        }
    );

    /**
     * POST /machines
     * Create a new machine
     */
    fastify.post<{ Body: CreateMachine }>(
        '/',
        {
            preHandler: [fastify.requireRole(['ADMIN', 'MANAGER'])],
            schema: {
                description: 'Create a new machine',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['serialNumber', 'label', 'type', 'capacityKg', 'pricePerCycle'],
                    properties: {
                        serialNumber: { type: 'string', minLength: 1, maxLength: 50 },
                        label: { type: 'string', minLength: 1, maxLength: 100 },
                        type: { type: 'string', enum: ['WASHER', 'DRYER'] },
                        capacityKg: { type: 'number', minimum: 0 },
                        pricePerCycle: { type: 'number', minimum: 0 },
                        location: { type: 'string', maxLength: 200 },
                    },
                },
            },
        },
        async (request, reply) => {
            const data = CreateMachineSchema.parse(request.body);

            try {
                const machine = await machineService.create(request.user!.tenantId, data);
                return reply.status(201).send(machine);
            } catch (error) {
                if (error instanceof Error && error.message.includes('already exists')) {
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
     * PATCH /machines/:id
     * Update a machine
     */
    fastify.patch<{ Params: { id: string }; Body: UpdateMachine }>(
        '/:id',
        {
            preHandler: [fastify.requireRole(['ADMIN', 'MANAGER'])],
            schema: {
                description: 'Update a machine',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                body: {
                    type: 'object',
                    properties: {
                        label: { type: 'string', minLength: 1, maxLength: 100 },
                        status: { type: 'string', enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE'] },
                        pricePerCycle: { type: 'number', minimum: 0 },
                        location: { type: 'string', maxLength: 200 },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = IdParamSchema.parse(request.params);
            const data = UpdateMachineSchema.parse(request.body);

            const machine = await machineService.update(request.user!.tenantId, id, data);

            if (!machine) {
                return reply.status(404).send({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Machine not found',
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
        '/:id',
        {
            preHandler: [fastify.requireRole(['ADMIN'])],
            schema: {
                description: 'Delete a machine',
                tags: ['Machines'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { id } = IdParamSchema.parse(request.params);

            const deleted = await machineService.delete(request.user!.tenantId, id);

            if (!deleted) {
                return reply.status(404).send({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Machine not found',
                });
            }

            return reply.status(204).send();
        }
    );
}

export default machineRoutes;

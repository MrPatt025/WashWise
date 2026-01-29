import { prisma } from '@washwise/database';
import type {
    CreateMachine,
    UpdateMachine,
    MachineQuery,
    Machine,
    MachineStatus,
    PaginatedResponse,
} from '@washwise/types';

/**
 * Machine Service - Handles all machine-related operations
 * CRITICAL: Every operation MUST include tenantId filter for isolation
 */
export class MachineService {
    /**
     * Create a new machine
     * @param tenantId - Required for multi-tenant isolation
     */
    async create(tenantId: string, data: CreateMachine): Promise<Machine> {
        // Check for duplicate serial number within tenant
        const existing = await prisma.machine.findUnique({
            where: {
                tenantId_serialNumber: {
                    tenantId,
                    serialNumber: data.serialNumber,
                },
            },
        });

        if (existing) {
            throw new Error('Machine with this serial number already exists');
        }

        const machine = await prisma.machine.create({
            data: {
                ...data,
                tenantId,
                status: 'AVAILABLE',
            },
        });

        return this.mapToMachine(machine);
    }

    /**
     * Get machine by ID
     * ANTI-IDOR: Returns null if machine doesn't belong to tenant (results in 404, not 403)
     */
    async getById(tenantId: string, machineId: string): Promise<Machine | null> {
        const machine = await prisma.machine.findFirst({
            where: {
                id: machineId,
                tenantId, // CRITICAL: Always filter by tenant
            },
        });

        return machine ? this.mapToMachine(machine) : null;
    }

    /**
     * List machines with pagination and filtering
     */
    async list(
        tenantId: string,
        query: MachineQuery
    ): Promise<PaginatedResponse<Machine>> {
        const { page = 1, limit = 20, type, status, search } = query;
        const skip = (page - 1) * limit;

        const where = {
            tenantId, // CRITICAL: Always filter by tenant
            ...(type && { type }),
            ...(status && { status }),
            ...(search && {
                OR: [
                    { label: { contains: search, mode: 'insensitive' as const } },
                    { serialNumber: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [items, total] = await Promise.all([
            prisma.machine.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.machine.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            items: items.map(this.mapToMachine),
            total,
            page,
            limit,
            totalPages,
            hasMore: page < totalPages,
        };
    }

    /**
     * Update a machine
     * ANTI-IDOR: Fails silently if machine doesn't belong to tenant
     */
    async update(
        tenantId: string,
        machineId: string,
        data: UpdateMachine
    ): Promise<Machine | null> {
        // First verify ownership
        const existing = await prisma.machine.findFirst({
            where: {
                id: machineId,
                tenantId,
            },
        });

        if (!existing) {
            return null; // Returns null for both not found AND wrong tenant (anti-IDOR)
        }

        const machine = await prisma.machine.update({
            where: { id: machineId },
            data,
        });

        return this.mapToMachine(machine);
    }

    /**
     * Update machine status (for IoT simulation)
     */
    async updateStatus(
        tenantId: string,
        machineId: string,
        status: MachineStatus
    ): Promise<Machine | null> {
        return this.update(tenantId, machineId, { status });
    }

    /**
     * Delete a machine
     * ANTI-IDOR: Returns false if machine doesn't belong to tenant
     */
    async delete(tenantId: string, machineId: string): Promise<boolean> {
        // First verify ownership
        const existing = await prisma.machine.findFirst({
            where: {
                id: machineId,
                tenantId,
            },
        });

        if (!existing) {
            return false;
        }

        await prisma.machine.delete({
            where: { id: machineId },
        });

        return true;
    }

    /**
     * Get machine statistics for dashboard
     */
    async getStats(tenantId: string): Promise<{
        total: number;
        available: number;
        busy: number;
        offline: number;
        maintenance: number;
    }> {
        const stats = await prisma.machine.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: true,
        });

        const result = {
            total: 0,
            available: 0,
            busy: 0,
            offline: 0,
            maintenance: 0,
        };

        for (const stat of stats) {
            const count = stat._count;
            result.total += count;

            switch (stat.status) {
                case 'AVAILABLE':
                    result.available = count;
                    break;
                case 'BUSY':
                    result.busy = count;
                    break;
                case 'OFFLINE':
                    result.offline = count;
                    break;
                case 'MAINTENANCE':
                    result.maintenance = count;
                    break;
            }
        }

        return result;
    }

    /**
     * Map Prisma model to domain type
     */
    private mapToMachine(machine: {
        id: string;
        tenantId: string;
        serialNumber: string;
        label: string;
        type: string;
        capacityKg: number;
        status: string;
        pricePerCycle: number;
        location: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): Machine {
        return {
            id: machine.id,
            tenantId: machine.tenantId,
            serialNumber: machine.serialNumber,
            label: machine.label,
            type: machine.type as 'WASHER' | 'DRYER',
            capacityKg: machine.capacityKg,
            status: machine.status as 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE',
            pricePerCycle: machine.pricePerCycle,
            location: machine.location,
            createdAt: machine.createdAt,
            updatedAt: machine.updatedAt,
        };
    }
}

export default MachineService;

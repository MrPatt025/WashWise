import { prisma } from "@washwise/database";
import type {
  CreateMachine,
  Machine,
  MachineQuery,
  MachineStatus,
  PaginatedResponse,
  UpdateMachine,
} from "@washwise/types";
import type {
  Machine as PrismaMachine,
  MachineStatus as PrismaMachineStatus,
} from "@prisma/client";

/**
 * Machine Service - Handles all machine-related operations
 * CRITICAL: Every operation MUST include tenantId filter for isolation
 */
export class MachineService {
  /**
   * Create a new machine
   * @param tenantId - Required for multi-tenant isolation
   * @param data - Machine creation data including branchId
   */
  async create(tenantId: string, data: CreateMachine): Promise<Machine> {
    const { branchId, ...machineData } = data;
    // Generate serial number if not provided
    const serialNumber =
      machineData.serialNumber || `M-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Check for duplicate serial number within tenant
    const existing = await prisma.machine.findUnique({
      where: {
        tenantId_serialNumber: {
          tenantId,
          serialNumber,
        },
      },
    });

    if (existing) {
      throw new Error("Machine with this serial number already exists");
    }

    const machine = await prisma.machine.create({
      data: {
        tenantId,
        branchId,
        serialNumber,
        label: machineData.name,
        type: machineData.type,
        capacityKg: machineData.capacityKg || 10,
        pricePerCycle: machineData.pricePerCycle,
        cycleDurationMins: machineData.cycleDurationMinutes || 45,
        manufacturer: machineData.manufacturer,
        model: machineData.model,
        status: "IDLE",
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
  async list(tenantId: string, query: MachineQuery): Promise<PaginatedResponse<Machine>> {
    const { page, limit, type, status, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId, // CRITICAL: Always filter by tenant
      ...(type && { type }),
      ...(status && { status: status as PrismaMachineStatus }),
      ...(search && {
        OR: [
          { label: { contains: search, mode: "insensitive" as const } },
          { serialNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.machine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.machine.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((m) => this.mapToMachine(m)),
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
  async update(tenantId: string, machineId: string, data: UpdateMachine): Promise<Machine | null> {
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
      data: {
        ...(data.name && { label: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.capacityKg !== undefined && { capacityKg: data.capacityKg }),
        ...(data.pricePerCycle !== undefined && { pricePerCycle: data.pricePerCycle }),
        ...(data.cycleDurationMinutes !== undefined && {
          cycleDurationMins: data.cycleDurationMinutes,
        }),
        ...(data.manufacturer && { manufacturer: data.manufacturer }),
        ...(data.model && { model: data.model }),
        ...(data.serialNumber && { serialNumber: data.serialNumber }),
      },
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
    // First verify ownership
    const existing = await prisma.machine.findFirst({
      where: {
        id: machineId,
        tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    const machine = await prisma.machine.update({
      where: { id: machineId },
      data: { status: status as PrismaMachineStatus },
    });

    return this.mapToMachine(machine);
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
    idle: number;
    inUse: number;
    error: number;
    maintenance: number;
  }> {
    const stats = await prisma.machine.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    });

    const result = {
      total: 0,
      idle: 0,
      inUse: 0,
      error: 0,
      maintenance: 0,
    };

    for (const stat of stats) {
      const count = stat._count;
      result.total += count;

      switch (stat.status) {
        case "IDLE":
          result.idle = count;
          break;
        case "RUNNING":
        case "RESERVED":
          result.inUse += count;
          break;
        case "OFFLINE":
        case "ERROR":
        case "OUT_OF_ORDER":
        case "DISABLED":
          result.error += count;
          break;
        case "MAINTENANCE":
          result.maintenance = count;
          break;
      }
    }

    return result;
  }

  /**
   * Map Prisma model to domain type
   */
  private mapToMachine(machine: PrismaMachine): Machine {
    return {
      id: machine.id,
      tenantId: machine.tenantId,
      name: machine.label,
      label: machine.label,
      machineNumber: machine.serialNumber,
      serialNumber: machine.serialNumber,
      type: machine.type as "WASHER" | "DRYER",
      capacityKg: machine.capacityKg,
      status: machine.status as MachineStatus,
      pricePerCycle: machine.pricePerCycle,
      cycleDurationMinutes: machine.cycleDurationMins,
      manufacturer: machine.manufacturer,
      model: machine.model,
      branchId: machine.branchId,
      createdAt: machine.createdAt.toISOString(),
      updatedAt: machine.updatedAt.toISOString(),
    };
  }
}

export default MachineService;

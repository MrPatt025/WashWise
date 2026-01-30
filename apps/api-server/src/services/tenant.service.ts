import { prisma } from "@washwise/database";
import type { Tenant, CreateTenant } from "@washwise/types";

/**
 * Tenant Service - Handles tenant-related operations
 */
export class TenantService {
  /**
   * Get tenant by ID
   */
  async getById(tenantId: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return tenant ? this.mapToTenant(tenant) : null;
  }

  /**
   * Update tenant
   */
  async update(
    tenantId: string,
    data: Partial<CreateTenant>,
  ): Promise<Tenant | null> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    return this.mapToTenant(tenant);
  }

  /**
   * Map Prisma model to domain type
   */
  private mapToTenant(tenant: {
    id: string;
    name: string;
    plan: string;
    createdAt: Date;
    updatedAt: Date;
  }): Tenant {
    return {
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan as "FREE" | "BASIC" | "PRO" | "ENTERPRISE",
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}

export default TenantService;

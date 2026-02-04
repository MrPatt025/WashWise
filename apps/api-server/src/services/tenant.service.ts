import { prisma, type Prisma } from "@washwise/database";
import type { CreateTenant, Tenant, TenantPlan } from "@washwise/types";

// Use Prisma's generated type for Tenant model
type PrismaTenant = Prisma.TenantGetPayload<Record<string, never>>;

// Valid tenant plans for type guard
const VALID_PLANS: readonly TenantPlan[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"] as const;

function isValidPlan(plan: string): plan is TenantPlan {
  return VALID_PLANS.includes(plan as TenantPlan);
}

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
  async update(tenantId: string, data: Partial<CreateTenant>): Promise<Tenant | null> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    return this.mapToTenant(tenant);
  }

  /**
   * Map Prisma model to domain type
   */
  private mapToTenant(tenant: PrismaTenant): Tenant {
    const plan = isValidPlan(tenant.plan) ? tenant.plan : "FREE";
    return {
      id: tenant.id,
      name: tenant.name,
      plan,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}

export default TenantService;

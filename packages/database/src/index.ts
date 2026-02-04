import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Re-export Prisma types explicitly
export type {
  User,
  Tenant,
  Machine,
  Branch,
  RefreshToken,
  MachineStatus,
  MachineType,
  UserRole,
  TenantPlan,
  Prisma,
} from "@prisma/client";

// Create connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

// Global Prisma client instance with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export default prisma;

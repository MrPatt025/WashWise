import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "argon2";

// Create connection pool for seeding
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://washwise:washwise@localhost:5432/washwise",
});

// Create adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      slug: "demo",
      name: "Demo Laundromat",
      plan: "PRO",
      email: "contact@demo-laundromat.com",
    },
  });

  console.log(`✅ Created tenant: ${demoTenant.name} (slug: ${demoTenant.slug})`);

  // Create demo branch
  const demoBranch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: "MAIN",
      },
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      tenantId: demoTenant.id,
      name: "Main Branch",
      code: "MAIN",
      address: "123 Laundry Street, Bangkok",
    },
  });

  console.log(`✅ Created branch: ${demoBranch.name}`);

  // Create demo owner user
  const hashedPassword = await hash("Owner123!");
  const ownerUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: "owner@demo.com",
      },
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "owner@demo.com",
      password: hashedPassword,
      name: "Demo Owner",
      role: "OWNER",
      tenantId: demoTenant.id,
    },
  });

  console.log(`✅ Created owner user: ${ownerUser.email}`);

  // Create demo machines
  const machines = [
    {
      id: "00000000-0000-0000-0000-000000000101",
      serialNumber: "WM-001",
      label: "Washer 1",
      type: "WASHER" as const,
      capacityKg: 8,
      status: "IDLE" as const,
      pricePerCycle: 3.5,
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      serialNumber: "WM-002",
      label: "Washer 2",
      type: "WASHER" as const,
      capacityKg: 12,
      status: "RUNNING" as const,
      pricePerCycle: 5,
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      serialNumber: "DR-001",
      label: "Dryer 1",
      type: "DRYER" as const,
      capacityKg: 10,
      status: "IDLE" as const,
      pricePerCycle: 2.5,
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      serialNumber: "DR-002",
      label: "Dryer 2",
      type: "DRYER" as const,
      capacityKg: 15,
      status: "OFFLINE" as const,
      pricePerCycle: 3.5,
    },
  ];

  for (const machine of machines) {
    await prisma.machine.upsert({
      where: {
        tenantId_serialNumber: {
          tenantId: demoTenant.id,
          serialNumber: machine.serialNumber,
        },
      },
      update: {},
      create: {
        ...machine,
        tenantId: demoTenant.id,
        branchId: demoBranch.id,
      },
    });
  }

  console.log(`✅ Created ${machines.length} machines`);

  // Create a second tenant for IDOR testing
  const testTenant = await prisma.tenant.upsert({
    where: { slug: "test-idor" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000099",
      slug: "test-idor",
      name: "Test Tenant (IDOR)",
      plan: "FREE",
    },
  });

  const testBranch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: testTenant.id,
        code: "MAIN",
      },
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000090",
      tenantId: testTenant.id,
      name: "Test Branch",
      code: "MAIN",
    },
  });

  const _testUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: testTenant.id,
        email: "test@other.com",
      },
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000098",
      email: "test@other.com",
      password: hashedPassword,
      name: "Test User",
      role: "OWNER",
      tenantId: testTenant.id,
    },
  });

  await prisma.machine.upsert({
    where: {
      tenantId_serialNumber: {
        tenantId: testTenant.id,
        serialNumber: "OTHER-001",
      },
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000199",
      serialNumber: "OTHER-001",
      label: "Other Tenant Machine",
      type: "WASHER",
      capacityKg: 8,
      status: "IDLE",
      pricePerCycle: 3,
      tenantId: testTenant.id,
      branchId: testBranch.id,
    },
  });

  console.log(`✅ Created test tenant for IDOR testing: ${testTenant.name}`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });

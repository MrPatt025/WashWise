import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Demo Laundromat",
      plan: "PRO",
    },
  });

  console.log(`✅ Created tenant: ${demoTenant.name}`);

  // Create demo owner user
  const hashedPassword = await hash("Owner123!");
  const ownerUser = await prisma.user.upsert({
    where: {
      email: "owner@demo.com",
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
      status: "AVAILABLE" as const,
      pricePerCycle: 3.5,
      location: "Row A",
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      serialNumber: "WM-002",
      label: "Washer 2",
      type: "WASHER" as const,
      capacityKg: 12,
      status: "BUSY" as const,
      pricePerCycle: 5,
      location: "Row A",
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      serialNumber: "DR-001",
      label: "Dryer 1",
      type: "DRYER" as const,
      capacityKg: 10,
      status: "AVAILABLE" as const,
      pricePerCycle: 2.5,
      location: "Row B",
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      serialNumber: "DR-002",
      label: "Dryer 2",
      type: "DRYER" as const,
      capacityKg: 15,
      status: "OFFLINE" as const,
      pricePerCycle: 3.5,
      location: "Row B",
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
      },
    });
  }

  console.log(`✅ Created ${machines.length} machines`);

  // Create a second tenant for IDOR testing
  const testTenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000099" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000099",
      name: "Test Tenant (IDOR)",
      plan: "FREE",
    },
  });

  const _testUser = await prisma.user.upsert({
    where: {
      email: "test@other.com",
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
      status: "AVAILABLE",
      pricePerCycle: 3,
      tenantId: testTenant.id,
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

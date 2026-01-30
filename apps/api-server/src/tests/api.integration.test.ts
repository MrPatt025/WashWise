import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import type { FastifyInstance } from "fastify";
import { hash } from "argon2";

/**
 * Integration tests using Testcontainers
 * REQUIREMENT: No database mocks - real PostgreSQL containers
 */
describe("WashWise API Integration Tests", () => {
    let container: StartedPostgreSqlContainer;
    let prisma: PrismaClient;
    let app: FastifyInstance;

    // Test users and tokens
    let tenantAId: string;
    let tenantBId: string;
    let userAToken: string;
    let userBToken: string;
    let machineAId: string;
    let machineBId: string;

    beforeAll(async () => {
        // Start PostgreSQL container
        console.log("🐳 Starting PostgreSQL container...");
        container = await new PostgreSqlContainer("postgres:17-alpine")
            .withDatabase("washwise_test")
            .withUsername("test")
            .withPassword("test")
            .start();

        const databaseUrl = container.getConnectionUri();
        console.log("✅ PostgreSQL container started");

        // Set environment variables BEFORE importing the app
        process.env.DATABASE_URL = databaseUrl;
        process.env.JWT_ACCESS_SECRET =
            "test-access-secret-minimum-32-characters-long";
        process.env.JWT_REFRESH_SECRET =
            "test-refresh-secret-minimum-32-characters-long";
        process.env.NODE_ENV = "test";
        process.env.REDIS_URL = "redis://localhost:6379";

        // Push schema to database (creates tables without migrations)
        console.log("📦 Pushing Prisma schema...");
        execSync("npx prisma db push --skip-generate --accept-data-loss", {
            cwd: "../../packages/database",
            env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: "inherit",
      });

        // Initialize Prisma client
        prisma = new PrismaClient({
            datasources: { db: { url: databaseUrl } },
        });

        // Dynamically import buildApp AFTER env vars are set
        const { buildApp } = await import("../app.js");

        // Build Fastify app
        app = await buildApp();
        await app.ready();

        console.log("✅ Test environment ready");
    }, 120000); // 2 minutes timeout for container startup

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
        await container.stop();
        console.log("🧹 Test environment cleaned up");
    });

    beforeEach(async () => {
        // Clean database between tests
        await prisma.refreshToken.deleteMany();
        await prisma.machine.deleteMany();
        await prisma.user.deleteMany();
        await prisma.tenant.deleteMany();
    });

    describe("Authentication System", () => {
        it("should register a new user and tenant", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/v1/auth/register",
                payload: {
                    email: "test@example.com",
                    password: "SecurePass123!",
                    name: "Test User",
                    tenantName: "Test Laundromat",
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.accessToken).toBeDefined();
            expect(body.user.email).toBe("test@example.com");
            expect(body.user.tenantName).toBe("Test Laundromat");
        });

        it("should login and receive tokens", async () => {
            // Setup: Create user
            const tenant = await prisma.tenant.create({
              data: { name: "Login Test Tenant", plan: "FREE" },
          });
          await prisma.user.create({
              data: {
                email: "login@test.com",
                password: await hash("TestPass123!"),
                name: "Login User",
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });

          // Test login
          const response = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: {
                email: "login@test.com",
                password: "TestPass123!",
            },
        });

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          expect(body.accessToken).toBeDefined();

          // Check refresh token cookie is set
          const cookies = response.cookies;
          const refreshCookie = cookies.find(
            (c: { name: string }) => c.name === "washwise_refresh_token",
        );
          expect(refreshCookie).toBeDefined();
          expect(refreshCookie!.httpOnly).toBe(true);
      });

        it("should refresh tokens with rotation", async () => {
            // Setup: Create user and login
            const tenant = await prisma.tenant.create({
              data: { name: "Refresh Test Tenant", plan: "FREE" },
          });
          await prisma.user.create({
              data: {
                email: "refresh@test.com",
                password: await hash("TestPass123!"),
                name: "Refresh User",
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });

          const loginResponse = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: {
                email: "refresh@test.com",
                password: "TestPass123!",
            },
        });

          const refreshCookie = loginResponse.cookies.find(
            (c: { name: string }) => c.name === "washwise_refresh_token",
        );

          // Test refresh
          const refreshResponse = await app.inject({
            method: "POST",
            url: "/api/v1/auth/refresh",
            cookies: {
                washwise_refresh_token: refreshCookie!.value,
            },
        });

          expect(refreshResponse.statusCode).toBe(200);
          const body = JSON.parse(refreshResponse.body);
          expect(body.accessToken).toBeDefined();

          // Verify new refresh token is different
          const newRefreshCookie = refreshResponse.cookies.find(
            (c: { name: string }) => c.name === "washwise_refresh_token",
        );
          expect(newRefreshCookie!.value).not.toBe(refreshCookie!.value);
      });

        it("should detect and prevent token reuse (theft detection)", async () => {
            // Setup: Create user and login
            const tenant = await prisma.tenant.create({
              data: { name: "Reuse Test Tenant", plan: "FREE" },
          });
          await prisma.user.create({
              data: {
                email: "reuse@test.com",
                password: await hash("TestPass123!"),
                name: "Reuse User",
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });

          const loginResponse = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: {
                email: "reuse@test.com",
                password: "TestPass123!",
            },
        });

          const originalRefreshToken = loginResponse.cookies.find(
            (c: { name: string }) => c.name === "washwise_refresh_token",
        )!.value;

          // First refresh (legitimate)
          const firstRefresh = await app.inject({
            method: "POST",
            url: "/api/v1/auth/refresh",
            cookies: { washwise_refresh_token: originalRefreshToken },
        });
          expect(firstRefresh.statusCode).toBe(200);

          // ATTACK: Attempt to reuse the original token
          const attackResponse = await app.inject({
            method: "POST",
            url: "/api/v1/auth/refresh",
            cookies: { washwise_refresh_token: originalRefreshToken },
        });

          // Should be rejected - all tokens in family revoked
          expect(attackResponse.statusCode).toBe(401);
          const body = JSON.parse(attackResponse.body);
          expect(body.message).toContain("Token reuse detected");

          // Verify legitimate user is also logged out
          const newToken = firstRefresh.cookies.find(
            (c: { name: string }) => c.name === "washwise_refresh_token",
        )!.value;

          const legitRefresh = await app.inject({
            method: "POST",
            url: "/api/v1/auth/refresh",
            cookies: { washwise_refresh_token: newToken },
        });
          expect(legitRefresh.statusCode).toBe(401);
      });
    });

    describe("Multi-tenant Isolation (IDOR Protection)", () => {
        beforeEach(async () => {
            // Create two tenants with users and machines
            const tenantA = await prisma.tenant.create({
                data: { name: "Tenant A", plan: "PRO" },
            });
            tenantAId = tenantA.id;

            const tenantB = await prisma.tenant.create({
            data: { name: "Tenant B", plan: "FREE" },
        });
            tenantBId = tenantB.id;

            // Create users
            await prisma.user.create({
                data: {
                email: "admin@tenant-a.com",
                password: await hash("PassA123!"),
                name: "Admin A",
                role: "ADMIN",
                tenantId: tenantA.id,
            },
        });

            await prisma.user.create({
                data: {
                email: "admin@tenant-b.com",
                password: await hash("PassB123!"),
                name: "Admin B",
                role: "ADMIN",
                tenantId: tenantB.id,
            },
        });

            // Create machines
            const machineA = await prisma.machine.create({
                data: {
                serialNumber: "MACHINE-A-001",
                label: "Tenant A Washer",
                type: "WASHER",
                capacityKg: 10,
                status: "AVAILABLE",
                pricePerCycle: 5.0,
                tenantId: tenantA.id,
            },
        });
            machineAId = machineA.id;

            const machineB = await prisma.machine.create({
                data: {
                serialNumber: "MACHINE-B-001",
                label: "Tenant B Washer",
                type: "WASHER",
                capacityKg: 8,
                status: "AVAILABLE",
                pricePerCycle: 4.0,
                tenantId: tenantB.id,
            },
        });
            machineBId = machineB.id;

            // Login both users
            const loginA = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: { email: "admin@tenant-a.com", password: "PassA123!" },
        });
            userAToken = JSON.parse(loginA.body).accessToken;

            const loginB = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: { email: "admin@tenant-b.com", password: "PassB123!" },
        });
            userBToken = JSON.parse(loginB.body).accessToken;
        });

        it("should allow user to access their own tenant machines", async () => {
            const response = await app.inject({
              method: "GET",
              url: `/api/v1/machines/${machineAId}`,
              headers: { Authorization: `Bearer ${userAToken}` },
          });

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          expect(body.id).toBe(machineAId);
          expect(body.label).toBe("Tenant A Washer");
      });

        it("should return 404 when accessing another tenant machine (IDOR protection)", async () => {
            // User A trying to access Tenant B's machine
            const response = await app.inject({
              method: "GET",
              url: `/api/v1/machines/${machineBId}`,
              headers: { Authorization: `Bearer ${userAToken}` },
          });

          // CRITICAL: Must return 404, not 403 (prevents resource enumeration)
          expect(response.statusCode).toBe(404);
          const body = JSON.parse(response.body);
          expect(body.message).toBe("Machine not found");
      });

        it("should not list machines from other tenants", async () => {
            const response = await app.inject({
              method: "GET",
              url: "/api/v1/machines",
              headers: { Authorization: `Bearer ${userAToken}` },
          });

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);

          // Should only see Tenant A's machine
          expect(body.items).toHaveLength(1);
          expect(body.items[0].id).toBe(machineAId);
      });

        it("should prevent updating another tenant machine", async () => {
            const response = await app.inject({
              method: "PATCH",
              url: `/api/v1/machines/${machineBId}`,
              headers: { Authorization: `Bearer ${userAToken}` },
              payload: { label: "Hacked Label" },
          });

          // Must return 404 (anti-IDOR)
          expect(response.statusCode).toBe(404);

          // Verify machine was not actually modified
          const machine = await prisma.machine.findUnique({
              where: { id: machineBId },
          });
          expect(machine!.label).toBe("Tenant B Washer");
      });

        it("should prevent deleting another tenant machine", async () => {
            const response = await app.inject({
              method: "DELETE",
              url: `/api/v1/machines/${machineBId}`,
              headers: { Authorization: `Bearer ${userAToken}` },
          });

          expect(response.statusCode).toBe(404);

          // Verify machine still exists
          const machine = await prisma.machine.findUnique({
              where: { id: machineBId },
          });
          expect(machine).not.toBeNull();
      });
    });

    describe("Machine CRUD Operations", () => {
        let testToken: string;
        let testTenantId: string;

        beforeEach(async () => {
            const tenant = await prisma.tenant.create({
              data: { name: "CRUD Test Tenant", plan: "PRO" },
          });
          testTenantId = tenant.id;

          await prisma.user.create({
              data: {
                email: "crud@test.com",
                password: await hash("CrudPass123!"),
                name: "CRUD User",
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });

          const login = await app.inject({
            method: "POST",
            url: "/api/v1/auth/login",
            payload: { email: "crud@test.com", password: "CrudPass123!" },
        });
          testToken = JSON.parse(login.body).accessToken;
      });

        it("should create a machine", async () => {
            const response = await app.inject({
              method: "POST",
              url: "/api/v1/machines",
              headers: { Authorization: `Bearer ${testToken}` },
              payload: {
              serialNumber: "NEW-001",
              label: "New Washer",
              type: "WASHER",
              capacityKg: 12,
              pricePerCycle: 6.5,
                  location: "Row C",
              },
          });

          expect(response.statusCode).toBe(201);
          const body = JSON.parse(response.body);
          expect(body.serialNumber).toBe("NEW-001");
          expect(body.type).toBe("WASHER");
          expect(body.status).toBe("AVAILABLE");
      });

        it("should prevent duplicate serial numbers within tenant", async () => {
            // Create first machine
            await app.inject({
              method: "POST",
              url: "/api/v1/machines",
              headers: { Authorization: `Bearer ${testToken}` },
              payload: {
                  serialNumber: "DUP-001",
                  label: "First Machine",
                  type: "WASHER",
                  capacityKg: 8,
                  pricePerCycle: 4.0,
              },
          });

          // Try to create duplicate
          const response = await app.inject({
            method: "POST",
            url: "/api/v1/machines",
            headers: { Authorization: `Bearer ${testToken}` },
            payload: {
                serialNumber: "DUP-001",
                label: "Duplicate Machine",
                type: "DRYER",
                capacityKg: 10,
                pricePerCycle: 3.0,
            },
        });

          expect(response.statusCode).toBe(409);
      });

        it("should update machine status", async () => {
            // Create machine
            const createResponse = await app.inject({
              method: "POST",
              url: "/api/v1/machines",
              headers: { Authorization: `Bearer ${testToken}` },
              payload: {
                  serialNumber: "UPD-001",
                  label: "Update Test",
                  type: "DRYER",
                  capacityKg: 15,
                  pricePerCycle: 3.5,
              },
          });
          const machineId = JSON.parse(createResponse.body).id;

          // Update status
          const updateResponse = await app.inject({
            method: "PATCH",
            url: `/api/v1/machines/${machineId}`,
            headers: { Authorization: `Bearer ${testToken}` },
            payload: { status: "BUSY" },
        });

          expect(updateResponse.statusCode).toBe(200);
          const body = JSON.parse(updateResponse.body);
          expect(body.status).toBe("BUSY");
      });

        it("should get machine statistics", async () => {
        // Create machines with different statuses
          const machines: Array<{
              serialNumber: string;
              status: "AVAILABLE" | "BUSY" | "OFFLINE" | "MAINTENANCE";
          }> = [
                  { serialNumber: "STAT-001", status: "AVAILABLE" },
                  { serialNumber: "STAT-002", status: "AVAILABLE" },
                  { serialNumber: "STAT-003", status: "BUSY" },
                  { serialNumber: "STAT-004", status: "OFFLINE" },
            ];

          for (const m of machines) {
              await prisma.machine.create({
                  data: {
                      serialNumber: m.serialNumber,
                      status: m.status,
                      label: `Machine ${m.serialNumber}`,
                    type: "WASHER",
                    capacityKg: 10,
                    pricePerCycle: 5,
                    tenantId: testTenantId,
                },
            });
        }

          const response = await app.inject({
            method: "GET",
            url: "/api/v1/machines/stats",
            headers: { Authorization: `Bearer ${testToken}` },
        });

          expect(response.statusCode).toBe(200);
          const body = JSON.parse(response.body);
          expect(body.total).toBe(4);
          expect(body.available).toBe(2);
          expect(body.busy).toBe(1);
          expect(body.offline).toBe(1);
      });
    });
});

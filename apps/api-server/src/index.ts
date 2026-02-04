import { buildApp } from "./app.js";
import { setupSocketIO } from "./socket/index.js";
import { closeRedis, env } from "./config/index.js";
import { prisma } from "@washwise/database";

async function main() {
  try {
    // Build Fastify app first
    const app = await buildApp();

    // Setup Socket.io on Fastify's underlying server
    const io = setupSocketIO(app.server);
    console.info("✅ Socket.io initialized");
    console.info("✅ Fastify initialized");

    // Store io reference for routes that need it
    app.decorate("io", io);

    // Start listening
    await app.listen({ port: env.PORT, host: "0.0.0.0" });

    console.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧺 WashWise API Server                                  ║
║                                                           ║
║   HTTP:    http://localhost:${String(env.PORT)}                        ║
║   WS:      ws://localhost:${String(env.PORT)}                          ║
║   Docs:    http://localhost:${String(env.PORT)}/docs                   ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(10)}                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.info(`\n${signal} received. Shutting down gracefully...`);

      // Close Socket.io
      await new Promise<void>((resolve) => io.close(() => resolve()));

      // Close Fastify
      await app.close();

      // Close Redis
      await closeRedis();

      // Close Prisma
      await prisma.$disconnect();

      console.info("✅ Server shutdown complete");
      process.exit(0);
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

void main();

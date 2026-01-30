import { buildApp } from "./app.js";
import { setupSocketIO } from "./socket/index.js";
import { env, closeRedis } from "./config/index.js";
import { prisma } from "@washwise/database";

async function main() {
  try {
    // Build Fastify app first
    const app = await buildApp();

    // Setup Socket.io on Fastify's underlying server
    const io = setupSocketIO(app.server);
    console.log("✅ Socket.io initialized");
    console.log("✅ Fastify initialized");

    // Store io reference for routes that need it
    app.decorate("io", io);

    // Start listening
    await app.listen({ port: env.PORT, host: "0.0.0.0" });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧺 WashWise API Server                                  ║
║                                                           ║
║   HTTP:    http://localhost:${env.PORT}                        ║
║   WS:      ws://localhost:${env.PORT}                          ║
║   Docs:    http://localhost:${env.PORT}/docs                   ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(10)}                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      // Close Socket.io
      io.close();

      // Close Fastify
      await app.close();

      // Close Redis
      await closeRedis();

      // Close Prisma
      await prisma.$disconnect();

      console.log("✅ Server shutdown complete");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();

import { createServer } from 'http';
import { buildApp } from './app.js';
import { setupSocketIO } from './socket/index.js';
import { env, closeRedis } from './config/index.js';
import { prisma } from '@washwise/database';

async function main() {
    try {
        // Create HTTP server first (needed for Socket.io)
        const httpServer = createServer();

        // Setup Socket.io
        const io = setupSocketIO(httpServer);
        console.log('✅ Socket.io initialized');

        // Build Fastify app with Socket.io reference
        const app = await buildApp({ io });

        // Let Fastify handle HTTP requests
        httpServer.on('request', (req, res) => {
            app.server.emit('request', req, res);
        });

        // Start Fastify (without listening - httpServer handles that)
        await app.ready();
        console.log('✅ Fastify initialized');

        // Connect Fastify's server to our httpServer
        // @ts-ignore - Fastify internal
        app.server = httpServer;

        // Start HTTP server
        httpServer.listen(env.PORT, () => {
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
        });

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

            console.log('✅ Server shutdown complete');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();

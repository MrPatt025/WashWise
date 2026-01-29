import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@washwise/types';
import { SOCKET_EVENTS } from '@washwise/types';
import { getRedis } from '../config/redis.js';
import env from '../config/env.js';

// Extend Socket with user data
interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        email: string;
        tenantId: string;
        role: string;
    };
}

/**
 * Setup Socket.io with Redis adapter for horizontal scaling
 * Implements tenant-based room isolation
 */
export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.CORS_ORIGIN,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Setup Redis adapter for horizontal scaling
    if (env.NODE_ENV !== 'test') {
        setupRedisAdapter(io);
    }

    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

            socket.user = {
                userId: payload.sub,
                email: payload.email,
                tenantId: payload.tenantId,
                role: payload.role,
            };

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket: AuthenticatedSocket) => {
        const { user } = socket;

        if (!user) {
            socket.disconnect();
            return;
        }

        console.log(`Socket connected: ${socket.id} (User: ${user.email})`);

        // Auto-join tenant room
        const tenantRoom = `tenant:${user.tenantId}`;
        socket.join(tenantRoom);
        console.log(`User ${user.email} joined room ${tenantRoom}`);

        // Handle explicit room join (for additional rooms if needed)
        socket.on(SOCKET_EVENTS.JOIN_TENANT_ROOM, (data: { tenantId: string }) => {
            // Verify user belongs to this tenant (security check)
            if (data.tenantId === user.tenantId) {
                socket.join(`tenant:${data.tenantId}`);
            }
        });

        // Handle room leave
        socket.on(SOCKET_EVENTS.LEAVE_TENANT_ROOM, (data: { tenantId: string }) => {
            socket.leave(`tenant:${data.tenantId}`);
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    return io;
}

/**
 * Setup Redis adapter for Socket.io
 * Enables horizontal scaling across multiple server instances
 */
async function setupRedisAdapter(io: SocketIOServer): Promise<void> {
    try {
        const pubClient = getRedis().duplicate();
        const subClient = getRedis().duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        io.adapter(createAdapter(pubClient, subClient));
        console.log('✅ Socket.io Redis adapter initialized');
    } catch (error) {
        console.error('Failed to setup Redis adapter for Socket.io:', error);
        // Continue without Redis adapter (single-instance mode)
    }
}

export default setupSocketIO;

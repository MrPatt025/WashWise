import { type Socket, Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { SOCKET_EVENTS } from "@washwise/types";
import { getRedis } from "../config/redis.js";
import env from "../config/env.js";

// Runtime type guard for JWT payload validation
interface ValidatedTokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

function isValidTokenPayload(payload: unknown): payload is ValidatedTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "sub" in payload &&
    "email" in payload &&
    "tenantId" in payload &&
    "role" in payload &&
    typeof (payload as ValidatedTokenPayload).sub === "string" &&
    typeof (payload as ValidatedTokenPayload).email === "string" &&
    typeof (payload as ValidatedTokenPayload).tenantId === "string" &&
    typeof (payload as ValidatedTokenPayload).role === "string"
  );
}

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
    transports: ["websocket", "polling"],
  });

  // Setup Redis adapter for horizontal scaling
  if (env.NODE_ENV !== "test") {
    void setupRedisAdapter(io);
  }

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const authData = socket.handshake.auth as Record<string, unknown> | undefined;
    const authToken: unknown = authData?.token;
    const token = typeof authToken === "string" ? authToken : undefined;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const payload: unknown = jwt.verify(token, env.JWT_ACCESS_SECRET);

      if (!isValidTokenPayload(payload)) {
        throw new Error("Invalid token payload structure");
      }

      socket.user = {
        userId: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      };

      next();
    } catch (_error) {
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    const { user } = socket;

    if (!user) {
      socket.disconnect();
      return;
    }

    console.info(`Socket connected: ${socket.id} (User: ${user.email})`);

    // Auto-join tenant room
    const tenantRoom = `tenant:${user.tenantId}`;
    void socket.join(tenantRoom);
    console.info(`User ${user.email} joined room ${tenantRoom}`);

    // Handle explicit room join (for additional rooms if needed)
    socket.on(SOCKET_EVENTS.JOIN_TENANT_ROOM, (data: { tenantId: string }) => {
      // Verify user belongs to this tenant (security check)
      if (data.tenantId === user.tenantId) {
        void socket.join(`tenant:${data.tenantId}`);
      }
    });

    // Handle room leave
    socket.on(SOCKET_EVENTS.LEAVE_TENANT_ROOM, (data: { tenantId: string }) => {
      void socket.leave(`tenant:${data.tenantId}`);
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on("error", (error) => {
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
    console.info("✅ Socket.io Redis adapter initialized");
  } catch (error) {
    console.error("Failed to setup Redis adapter for Socket.io:", error);
    // Continue without Redis adapter (single-instance mode)
  }
}

export default setupSocketIO;

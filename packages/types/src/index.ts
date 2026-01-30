// Export all schemas and types
export * from "./schemas/index.js";

// Socket.io event types
export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_TENANT_ROOM: "tenant:join",
  LEAVE_TENANT_ROOM: "tenant:leave",

  // Server -> Client
  MACHINE_UPDATE: "machine:update",
  MACHINE_TELEMETRY: "machine:telemetry",

  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// JWT payload for request context
export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
}

// Request context with tenant info
export interface RequestContext {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

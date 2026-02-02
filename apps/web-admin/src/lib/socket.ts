import { io, Socket } from "socket.io-client";
import { getAuthState } from "@/stores/auth.store";
import { SOCKET_EVENTS, type MachineUpdateEvent, type TelemetryData } from "@washwise/types";

// Socket.io uses HTTP URL (not ws://) and handles upgrade internally
// Points to the Fastify API server which has Socket.io registered
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Socket connection state
 */
interface SocketState {
  socket: Socket | null;
  isConnecting: boolean;
  connectionAttempts: number;
  lastError: Error | null;
}

const state: SocketState = {
  socket: null,
  isConnecting: false,
  connectionAttempts: 0,
  lastError: null,
};

/**
 * Socket event callbacks
 */
type SocketEventCallbacks = {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onMachineUpdate?: (event: MachineUpdateEvent) => void;
  onMachineTelemetry?: (event: TelemetryData) => void;
};

let eventCallbacks: SocketEventCallbacks = {};

/**
 * Configure socket event callbacks
 */
export function configureSocketCallbacks(callbacks: SocketEventCallbacks): void {
  eventCallbacks = { ...eventCallbacks, ...callbacks };
}

/**
 * Get current socket connection state
 */
export function getSocketState(): Readonly<SocketState> {
  return { ...state };
}

/**
 * Get or create Socket.io connection
 * Authenticates using the access token from memory
 */
export function getSocket(): Socket | null {
  const token = getAuthState().accessToken;

  if (!token) {
    console.warn("[Socket] No access token available for connection");
    return null;
  }

  // Return existing connected socket
  if (state.socket?.connected) {
    return state.socket;
  }

  // Prevent multiple simultaneous connection attempts
  if (state.isConnecting) {
    return state.socket;
  }

  state.isConnecting = true;
  state.connectionAttempts++;

  state.socket = io(SOCKET_URL, {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true,
    // Exponential backoff
    randomizationFactor: 0.5,
  });

  // Connection lifecycle events
  state.socket.on("connect", () => {
    console.log("[Socket] Connected:", state.socket?.id);
    state.isConnecting = false;
    state.connectionAttempts = 0;
    state.lastError = null;
    eventCallbacks.onConnect?.();
  });

  state.socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
    state.isConnecting = false;
    eventCallbacks.onDisconnect?.(reason);

    // If server disconnected us, try to reconnect
    if (reason === "io server disconnect") {
      state.socket?.connect();
    }
  });

  state.socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    state.isConnecting = false;
    state.lastError = error;
    eventCallbacks.onError?.(error);
  });

  // Business events
  state.socket.on(SOCKET_EVENTS.MACHINE_UPDATE, (event: MachineUpdateEvent) => {
    console.debug("[Socket] Machine update:", event);
    eventCallbacks.onMachineUpdate?.(event);
  });

  state.socket.on(SOCKET_EVENTS.MACHINE_TELEMETRY, (event: TelemetryData) => {
    console.debug("[Socket] Machine telemetry:", event);
    eventCallbacks.onMachineTelemetry?.(event);
  });

  return state.socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (state.socket) {
    state.socket.removeAllListeners();
    state.socket.disconnect();
    state.socket = null;
    state.isConnecting = false;
    state.connectionAttempts = 0;
    console.log("[Socket] Disconnected and cleaned up");
  }
}

/**
 * Reconnect socket with fresh token
 */
export function reconnectSocket(): Socket | null {
  console.log("[Socket] Reconnecting...");
  disconnectSocket();
  return getSocket();
}

/**
 * Join a tenant room for scoped updates
 */
export function joinTenantRoom(tenantId: string): void {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit(SOCKET_EVENTS.JOIN_TENANT_ROOM, { tenantId });
    console.log("[Socket] Joined tenant room:", tenantId);
  }
}

/**
 * Leave a tenant room
 */
export function leaveTenantRoom(tenantId: string): void {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit(SOCKET_EVENTS.LEAVE_TENANT_ROOM, { tenantId });
    console.log("[Socket] Left tenant room:", tenantId);
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return state.socket?.connected ?? false;
}

export default getSocket;

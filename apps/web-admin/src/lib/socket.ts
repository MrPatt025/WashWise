import { io, Socket } from "socket.io-client";
import { getAuthState } from "@/stores/auth.store";

// Socket.io uses HTTP URL (not ws://) and handles upgrade internally
// Points to the Fastify API server which has Socket.io registered
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

/**
 * Get or create Socket.io connection
 * Authenticates using the access token from memory
 */
export function getSocket(): Socket | null {
  const token = getAuthState().accessToken;

  if (!token) {
    console.warn("No access token available for socket connection");
    return null;
  }

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      path: "/socket.io", // Default Socket.io path
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });
  }

  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Reconnect socket with new token
 */
export function reconnectSocket(): Socket | null {
  disconnectSocket();
  return getSocket();
}

export default getSocket;

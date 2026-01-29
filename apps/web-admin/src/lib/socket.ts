import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth.store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

let socket: Socket | null = null;

/**
 * Get or create Socket.io connection
 * Authenticates using the access token from memory
 */
export function getSocket(): Socket | null {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
        console.warn("No access token available for socket connection");
        return null;
    }

    if (!socket || !socket.connected) {
        socket = io(WS_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
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

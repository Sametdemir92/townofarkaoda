// ============================================
// Client-Side Socket.io Instance
// ============================================

"use client"

import { io, Socket } from "socket.io-client"
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: TypedSocket | null = null

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
      autoConnect: false,
    }) as TypedSocket
  }
  return socket
}

export function connectSocket(token: string): TypedSocket {
  const s = getSocket()
  if (!s.connected) {
    s.auth = { token }
    s.connect()
  }
  return s
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect()
  }
}

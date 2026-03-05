// ============================================
// Socket.io Server Kurulumu
// ============================================

import { Server as HttpServer } from "http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@/types/socket"
import { socketAuthMiddleware } from "./middleware"
import { registerRoomHandlers } from "./handlers/room-handler"
import { registerGameHandlers } from "./handlers/game-handler"
import { registerChatHandlers } from "./handlers/chat-handler"

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
    httpServer,
    {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    }
  )

  // Auth middleware
  io.use(socketAuthMiddleware as any)

  // Baglanti handler
  io.on("connection", (socket) => {
    const userData = socket.data as SocketData
    console.log(`[Socket] Baglanti: ${userData.username} (${userData.userId})`)

    // Handler'lari kaydet
    registerRoomHandlers(io as any, socket as any)
    registerGameHandlers(io as any, socket as any)
    registerChatHandlers(io as any, socket as any)

    // Baglanti kopma
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Baglanti koptu: ${userData.username} - ${reason}`)
    })
  })

  console.log("[Socket] Socket.io server hazir")
  return io
}

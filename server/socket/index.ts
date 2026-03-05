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
import { prisma } from "@/lib/prisma"

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

  // ---- Otomatik Oda Temizligi (10 dakika kuralı) ----
  // Eğer sunucu bir sebeple yeniden başlatılırsa setTimeout'lar uçar, o yüzden setInterval ile her dakika kontrol en güvenlisidir.
  setInterval(async () => {
    try {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
      const expiredRooms = await prisma.room.findMany({
        where: {
          status: "WAITING",
          createdAt: { lt: tenMinsAgo }
        }
      })

      if (expiredRooms.length > 0) {
        for (const room of expiredRooms) {
          // Durumu guncelle
          await prisma.room.update({
            where: { id: room.id },
            data: { status: "ENDED" }
          })

          // Iceridekileri uyar
          io.to(room.id).emit("room:error", { message: "Oda 10 dakika boyunca pasif kaldığı için otomatik kapatıldı." })

          // Ayrıca soket bağlantılarını odadan çıkarmak için özel bir komut gönderebiliriz ama 'error' şu anda error handler'a duşup yeterli olabilir:
          // Fakat Frontend'in 'error' alınca otomatik geri dönmediğini düşünerek room:updated da yollanabilir veya state update vs.
        }
      }
    } catch (e) {
      console.error("[Socket] Oda temizligi sirasinda hata:", e)
    }
  }, 60 * 1000)

  console.log("[Socket] Socket.io server hazir")
  return io
}

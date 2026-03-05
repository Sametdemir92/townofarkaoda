// ============================================
// Socket - Chat Event Handler'lari
// ============================================

import type { Server, Socket } from "socket.io"
import type { SocketData, ClientToServerEvents, ServerToClientEvents } from "@/types/socket"
import type { ChatMessage } from "@/types/game"
import { getGameEngine } from "@/server/game/engine"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  const socketData = socket.data as SocketData

  socket.on("chat:send", async ({ message, channel }) => {
    try {
      if (!socketData.roomId || !socketData.playerId) {
        socket.emit("error", { message: "Odada degilsiniz" })
        return
      }

      // Mesaj validasyonu
      const trimmed = message.trim()
      if (!trimmed || trimmed.length > 500) {
        socket.emit("error", { message: "Gecersiz mesaj" })
        return
      }

      const engine = getGameEngine(socketData.roomId)

      // Oyuncu hayatta mi kontrol et
      if (engine) {
        if (!engine.isPlayerAlive(socketData.playerId)) {
          socket.emit("error", { message: "Olu oyuncular mesaj gonderemez" })
          return
        }

        const state = engine.getState()

        // Faz kontrolleri
        if (state.phase === "night") {
          // Gece sadece mafya kendi aralarinda konusabilir
          if (channel !== "MAFIA") {
            socket.emit("error", { message: "Gece sadece mafya chati kullanilabilir" })
            return
          }

          const playerRole = engine.getPlayerRole(socketData.playerId)
          if (playerRole !== "MAFYA") {
            socket.emit("error", { message: "Sadece mafya uyeler gece konusabilir" })
            return
          }
        }

        if (state.phase === "day_discussion" || state.phase === "day_voting") {
          // Gunduz herkes PUBLIC kanalda konusabilir
          if (channel === "MAFIA") {
            socket.emit("error", { message: "Gunduz mafya chati kullanilamaz" })
            return
          }
        }
      }

      // Mesaj olustur
      const chatMessage: ChatMessage = {
        id: nanoid(),
        playerId: socketData.playerId,
        username: socketData.username,
        content: trimmed,
        channel,
        timestamp: Date.now(),
      }

      // DB'ye kaydet
      await prisma.message.create({
        data: {
          content: trimmed,
          playerId: socketData.playerId,
          roomId: socketData.roomId,
          channel: channel as any,
        },
      })

      // Mesaji gonder
      if (channel === "MAFIA") {
        // Sadece mafya uyelerine gonder
        if (engine) {
          const mafiaPlayers = engine.getMafiaPlayers()
          const sockets = await io.in(socketData.roomId).fetchSockets()

          for (const s of sockets) {
            const sd = s.data as SocketData
            if (sd.playerId && mafiaPlayers.some((p) => p.id === sd.playerId)) {
              s.emit("chat:message", chatMessage)
            }
          }
        }
      } else {
        // Herkese gonder
        io.to(socketData.roomId).emit("chat:message", chatMessage)
      }
    } catch (error) {
      console.error("chat:send hatasi:", error)
      socket.emit("error", { message: "Mesaj gonderilirken hata olustu" })
    }
  })
}

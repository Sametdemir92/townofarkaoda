// ============================================
// Socket - Oda Event Handler'lari
// ============================================

import type { Server, Socket } from "socket.io"
import type { SocketData, ClientToServerEvents, ServerToClientEvents } from "@/types/socket"
import { BOT_NAMES } from "@/types/game"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

// In-memory bot takibi (DB'de user olmadiklari icin)
const roomBots = new Map<string, Array<{ id: string; username: string }>>()

export function getRoomBots(roomId: string) {
  return roomBots.get(roomId) || []
}

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  const socketData = socket.data as SocketData

  // ---- Odaya Katil ----
  socket.on("room:join", async ({ roomCode }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: { players: { include: { user: true } } },
      })

      if (!room) {
        socket.emit("room:error", { message: "Oda bulunamadi" })
        return
      }

      if (room.status !== "WAITING") {
        socket.emit("room:error", { message: "Oyun zaten baslamis" })
        return
      }

      const bots = getRoomBots(room.id)
      const totalPlayers = room.players.length + bots.length

      if (totalPlayers >= room.maxPlayers) {
        socket.emit("room:error", { message: "Oda dolu" })
        return
      }

      // Oyuncu zaten odada mi?
      let player = room.players.find((p: any) => p.userId === socketData.userId)

      if (!player) {
        player = await prisma.player.create({
          data: {
            userId: socketData.userId,
            roomId: room.id,
          },
          include: { user: true },
        })
      }

      socketData.roomId = room.id
      socketData.playerId = player.id

      socket.join(room.id)

      // Odadaki tum oyunculari getir (gercek + bot)
      await emitRoomPlayers(io, room.id)
    } catch (error) {
      console.error("room:join hatasi:", error)
      socket.emit("room:error", { message: "Odaya katilirken hata olustu" })
    }
  })

  // ---- Bot Ekle ----
  socket.on("room:add-bot", async ({ roomId }) => {
    try {
      // Host kontrolu
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { players: true },
      })

      if (!room) {
        socket.emit("error", { message: "Oda bulunamadi" })
        return
      }

      if (room.hostId !== socketData.userId) {
        socket.emit("error", { message: "Sadece oda sahibi bot ekleyebilir" })
        return
      }

      if (room.status !== "WAITING") {
        socket.emit("error", { message: "Oyun baslamis, bot eklenemez" })
        return
      }

      const bots = getRoomBots(roomId)
      const totalPlayers = room.players.length + bots.length

      if (totalPlayers >= room.maxPlayers) {
        socket.emit("error", { message: "Oda dolu" })
        return
      }

      // Kullanilmamis bot ismi sec
      const usedNames = bots.map((b) => b.username)
      const availableNames = BOT_NAMES.filter((n) => !usedNames.includes(n))
      const botName = availableNames.length > 0
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : `Bot-${bots.length + 1}`

      const bot = {
        id: `bot-${nanoid(8)}`,
        username: `${botName} (Bot)`,
      }

      bots.push(bot)
      roomBots.set(roomId, bots)

      // Herkese bildir
      await emitRoomPlayers(io, roomId)
    } catch (error) {
      console.error("room:add-bot hatasi:", error)
      socket.emit("error", { message: "Bot eklenirken hata olustu" })
    }
  })

  // ---- Bot Cikar ----
  socket.on("room:remove-bot", async ({ roomId, botId }) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } })
      if (!room) return

      if (room.hostId !== socketData.userId) {
        socket.emit("error", { message: "Sadece oda sahibi bot cikarabilir" })
        return
      }

      const bots = getRoomBots(roomId)
      const filtered = bots.filter((b) => b.id !== botId)
      roomBots.set(roomId, filtered)

      await emitRoomPlayers(io, roomId)
    } catch (error) {
      console.error("room:remove-bot hatasi:", error)
    }
  })

  // ---- Odadan Kapat (Sadece Host) ----
  socket.on("room:close", async ({ roomId }) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } })
      
      // Sadece host kapatabilir
      if (room && room.hostId === socketData.userId) {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "ENDED" }
        })
        
        // Herkese odanin kapandigini bildir
        io.to(roomId).emit("room:closed")
        io.to(roomId).emit("room:error", { message: "Oda kurucu tarafindan kapatildi." })
      }
    } catch (error) {
      console.error("room:close hatasi:", error)
    }
  })

  // ---- Odadan Ayril ----
  socket.on("room:leave", async ({ roomId }) => {
    try {
      socket.leave(roomId)
      socketData.roomId = null
      socketData.playerId = null

      await emitRoomPlayers(io, roomId)
    } catch (error) {
      console.error("room:leave hatasi:", error)
    }
  })

  // ---- Baglanti Kopma ----
  socket.on("disconnect", async () => {
    if (socketData.roomId) {
      await emitRoomPlayers(io, socketData.roomId)
    }
  })
}

// ---- Yardimci: Oda Oyuncularini Gonder ----

async function emitRoomPlayers(io: TypedServer, roomId: string) {
  const players = await prisma.player.findMany({
    where: { roomId },
    include: { user: true },
  })

  const bots = getRoomBots(roomId)

  const allPlayers = [
    ...players.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      username: p.user.username,
      isConnected: true,
      isBot: false,
    })),
    ...bots.map((b) => ({
      id: b.id,
      userId: b.id,
      username: b.username,
      isConnected: true,
      isBot: true,
    })),
  ]

  io.to(roomId).emit("room:updated", { players: allPlayers })
}

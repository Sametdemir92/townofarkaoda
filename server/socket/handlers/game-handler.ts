// ============================================
// Socket - Oyun Event Handler'lari (Bot Destekli)
// ============================================

import type { Server, Socket } from "socket.io"
import type { SocketData, ClientToServerEvents, ServerToClientEvents } from "@/types/socket"
import type { GameState, Player, RoleName, ChatMessage } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"
import { createGameEngine, getGameEngine, removeGameEngine } from "@/server/game/engine"
import { getRoomBots } from "./room-handler"
import {
  decideBotNightAction,
  decideBotVote,
  generateBotMessage,
  getBotActionDelay,
  getBotVoteDelay,
  getBotChatDelay,
} from "@/server/game/bot-ai"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export function registerGameHandlers(io: TypedServer, socket: TypedSocket): void {
  const socketData = socket.data as SocketData

  // ---- Oyunu Baslat ----
  socket.on("game:start", async ({ roomId }) => {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { players: { include: { user: true } } },
      })

      if (!room) {
        socket.emit("error", { message: "Oda bulunamadi" })
        return
      }

      if (room.hostId !== socketData.userId) {
        socket.emit("error", { message: "Sadece oda sahibi oyunu baslatabilir" })
        return
      }

      if (room.status !== "WAITING") {
        socket.emit("error", { message: "Oyun zaten baslamis" })
        return
      }

      // Gercek oyuncular
      const realPlayers: Player[] = room.players.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        username: p.user.username,
        role: null,
        isAlive: true,
        isConnected: true,
        isBot: false,
      }))

      // Bot oyuncular
      const bots = getRoomBots(roomId)
      const botPlayers: Player[] = bots.map((b) => ({
        id: b.id,
        userId: b.id,
        username: b.username,
        role: null,
        isAlive: true,
        isConnected: true,
        isBot: true,
      }))

      const allPlayers = [...realPlayers, ...botPlayers]

      // Minimum 3 oyuncu kontrolu (bot dahil)
      if (allPlayers.length < 3) {
        socket.emit("error", { message: "En az 3 oyuncu gerekli (bot dahil)" })
        return
      }

      // Oda durumunu guncelle
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "PLAYING" },
      })

      // Oyun motorunu olustur
      const engine = createGameEngine(roomId, room.code, room.hostId, allPlayers)

      // Event handler'lari bagla (bot destekli)
      setupEngineEvents(io, engine, roomId)

      // Oyunu baslat
      engine.startGame()

      // Her gercek oyuncuya kendi rolunu gonder
      const state = engine.getState()

      for (const player of state.players) {
        if (player.role && !player.isBot) {
          // DB guncelle (sadece gercek oyuncular)
          await prisma.player.update({
            where: { id: player.id },
            data: { role: player.role as any },
          }).catch(() => { }) // Bot id'leri DB'de olmayabilir

          const sockets = await io.in(roomId).fetchSockets()
          const playerSocket = sockets.find(
            (s) => (s.data as SocketData).playerId === player.id
          )
          if (playerSocket) {
            const roleInfo = ROLE_DEFINITIONS[player.role]
            playerSocket.emit("game:role-assigned", {
              role: player.role,
              description: roleInfo.description,
            })
          }
        }
      }

      // Herkese durumunu (olu/diri) gozeterek state gonder
      const sanitizedState = sanitizeStateForPublic(state)
      io.in(roomId).fetchSockets().then((sockets) => {
        sockets.forEach((s) => {
          const sd = s.data as SocketData
          const player = state.players.find((p) => p.id === sd.playerId)
          if (player && !player.isAlive) {
            // Oluler herkesin rolunu gorur ama night actions gormez
            s.emit("game:state-update", { ...state, nightActions: [] })
          } else {
            // Yasiyorsa veya oyuncu degilse (seyirci vs) sanitize edilmis gonder
            s.emit("game:state-update", sanitizedState)
          }
        })
      })

      // Bot gece aksiyonlarini baslat
      scheduleBotNightActions(engine, io, roomId)
    } catch (error) {
      console.error("game:start hatasi:", error)
      socket.emit("error", { message: "Oyun baslatilirken hata olustu" })
    }
  })

  // ---- Gece Aksiyonu ----
  socket.on("game:night-action", ({ targetId }) => {
    try {
      if (!socketData.roomId || !socketData.playerId) return

      const engine = getGameEngine(socketData.roomId)
      if (!engine) return

      const success = engine.submitNightAction(socketData.playerId, targetId)
      if (!success) {
        socket.emit("error", { message: "Bu aksiyonu yapamazsiniz" })
      }
    } catch (error) {
      console.error("game:night-action hatasi:", error)
    }
  })

  // ---- Oy Ver ----
  socket.on("game:vote", ({ targetId }) => {
    try {
      if (!socketData.roomId || !socketData.playerId) return

      const engine = getGameEngine(socketData.roomId)
      if (!engine) return

      const success = engine.submitVote(socketData.playerId, targetId)
      if (!success) {
        socket.emit("error", { message: "Oy kullanilamadi" })
      }

      const state = engine.getState()
      io.to(socketData.roomId).emit("game:vote-update", { votes: state.votes })
    } catch (error) {
      console.error("game:vote hatasi:", error)
    }
  })
}

// ---- Bot Gece Aksiyonlari ----

function scheduleBotNightActions(
  engine: ReturnType<typeof createGameEngine>,
  io: TypedServer,
  roomId: string
): void {
  const state = engine.getState()
  if (state.phase !== "night") return

  const aliveBots = state.players.filter((p) => p.isAlive && p.isBot && p.role !== "VATANDAS")

  for (const bot of aliveBots) {
    const delay = getBotActionDelay()
    setTimeout(() => {
      const currentEngine = getGameEngine(roomId)
      if (!currentEngine) return
      const currentState = currentEngine.getState()
      if (currentState.phase !== "night") return

      const targetId = decideBotNightAction(bot, currentState.players, currentState.nightActions)
      if (targetId) {
        currentEngine.submitNightAction(bot.id, targetId)
      }
    }, delay)
  }
}

// ---- Bot Oylama ----

function scheduleBotVotes(
  engine: ReturnType<typeof createGameEngine>,
  io: TypedServer,
  roomId: string
): void {
  const state = engine.getState()
  if (state.phase !== "day_voting") return

  const aliveBots = state.players.filter((p) => p.isAlive && p.isBot)

  for (const bot of aliveBots) {
    const delay = getBotVoteDelay()
    setTimeout(() => {
      const currentEngine = getGameEngine(roomId)
      if (!currentEngine) return
      const currentState = currentEngine.getState()
      if (currentState.phase !== "day_voting") return

      const targetId = decideBotVote(bot, currentState.players, currentState.votes)
      const success = currentEngine.submitVote(bot.id, targetId)
      if (success) {
        io.to(roomId).emit("game:vote-update", { votes: currentEngine.getState().votes })
      }
    }, delay)
  }
}

// ---- Bot Chat Mesajlari ----

function scheduleBotChat(
  engine: ReturnType<typeof createGameEngine>,
  io: TypedServer,
  roomId: string,
  context: "day_start" | "accuse" | "after_death" | "mafia_night"
): void {
  const state = engine.getState()
  const channel = context === "mafia_night" ? "MAFIA" as const : "PUBLIC" as const

  let bots: Player[]
  if (context === "mafia_night") {
    bots = state.players.filter((p) => p.isAlive && p.isBot && p.role === "MAFYA")
  } else {
    bots = state.players.filter((p) => p.isAlive && p.isBot)
  }

  for (const bot of bots) {
    const delay = getBotChatDelay()
    setTimeout(async () => {
      const currentEngine = getGameEngine(roomId)
      if (!currentEngine) return
      const currentState = currentEngine.getState()

      // Faz hala dogru mu kontrol et
      if (context === "mafia_night" && currentState.phase !== "night") return
      if (context !== "mafia_night" && !currentState.phase.startsWith("day")) return

      const message = await generateBotMessage(bot, currentState.players, channel, context)
      if (message) {
        const chatMsg: ChatMessage = {
          id: nanoid(),
          playerId: bot.id,
          username: bot.username,
          content: message,
          channel: channel,
          timestamp: Date.now(),
        }

        if (channel === "MAFIA") {
          // Sadece mafya uyelerine gonder
          const mafiaPlayers = currentState.players.filter((p) => p.role === "MAFYA" && p.isAlive)
          io.in(roomId).fetchSockets().then((sockets) => {
            for (const s of sockets) {
              const sd = s.data as SocketData
              if (sd.playerId && mafiaPlayers.some((p) => p.id === sd.playerId)) {
                s.emit("chat:message", chatMsg)
              }
            }
          })
        } else {
          io.to(roomId).emit("chat:message", chatMsg)
        }
      }
    }, delay)
  }
}

// ---- Engine Event'lerini Socket.io'ya Bagla ----

function setupEngineEvents(
  io: TypedServer,
  engine: ReturnType<typeof createGameEngine>,
  roomId: string
): void {
  engine.onEvent("stateChange", (state: GameState) => {
    const sanitizedState = sanitizeStateForPublic(state)
    io.in(roomId).fetchSockets().then((sockets) => {
      sockets.forEach((s) => {
        const sd = s.data as SocketData
        const player = state.players.find((p) => p.id === sd.playerId)
        if (player && !player.isAlive) {
          s.emit("game:state-update", { ...state, nightActions: [] })
        } else {
          s.emit("game:state-update", sanitizedState)
        }
      })
    })
  })

  engine.onEvent("phaseChange", (phase: GameState["phase"], dayCount: number, timer: number) => {
    io.to(roomId).emit("game:phase-change", { phase, dayCount, timer })

    // Faz degisiminde bot aksiyonlarini zamanla
    const currentEngine = getGameEngine(roomId)
    if (!currentEngine) return

    if (phase === "night") {
      scheduleBotNightActions(currentEngine, io, roomId)
      scheduleBotChat(currentEngine, io, roomId, "mafia_night")
    } else if (phase === "day_discussion") {
      scheduleBotChat(currentEngine, io, roomId, "day_start")
      // Biraz sonra suclama mesajlari
      setTimeout(() => {
        const eng = getGameEngine(roomId)
        if (eng && eng.getState().phase === "day_discussion") {
          scheduleBotChat(eng, io, roomId, "accuse")
        }
      }, 8000)
    } else if (phase === "day_voting") {
      scheduleBotVotes(currentEngine, io, roomId)
    }
  })

  engine.onEvent("playerEliminated", (playerId: string, username: string, role: RoleName, reason: string) => {
    io.to(roomId).emit("game:player-eliminated", { playerId, username, role, reason })

    // DB guncelle (sadece gercek oyuncular)
    if (!playerId.startsWith("bot-")) {
      prisma.player.update({
        where: { id: playerId },
        data: { isAlive: false },
      }).catch(console.error)
    }

    // Olum sonrasi bot chatleri
    const eng = getGameEngine(roomId)
    if (eng) {
      setTimeout(() => {
        const currentEng = getGameEngine(roomId)
        if (currentEng && currentEng.getState().phase.startsWith("day")) {
          scheduleBotChat(currentEng, io, roomId, "after_death")
        }
      }, 2000)
    }
  })

  engine.onEvent("nightResult", async (playerId: string, message: string) => {
    // Bot'lara gece sonucu gondermek gereksiz, sadece gercek oyunculara
    if (playerId.startsWith("bot-")) return

    const sockets = await io.in(roomId).fetchSockets()
    const playerSocket = sockets.find(
      (s) => (s.data as SocketData).playerId === playerId
    )
    if (playerSocket) {
      playerSocket.emit("game:night-result", { message })
    }
  })

  engine.onEvent("gameEnd", async (winner: string, players: Player[]) => {
    io.to(roomId).emit("game:ended", {
      winner: winner as any,
      players: players.map((p) => ({
        id: p.id,
        username: p.username,
        role: p.role!,
        isAlive: p.isAlive,
      })),
    })

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "ENDED" },
    }).catch(console.error)

    setTimeout(() => removeGameEngine(roomId), 60000)
  })

  engine.onEvent("timerTick", (seconds: number) => {
    io.to(roomId).emit("timer:tick", { seconds })
  })

  engine.onEvent("gameLog", (entry: any) => {
    io.to(roomId).emit("game:log", entry)

    prisma.gameLog.create({
      data: {
        roomId,
        dayCount: entry.dayCount,
        phase: entry.phase,
        action: entry.action,
        detail: entry.detail,
      },
    }).catch(console.error)
  })
}

// ---- State Sanitize (Rolleri Gizle) ----

function sanitizeStateForPublic(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      role: p.isAlive ? null : p.role,
    })),
    nightActions: [],
  }
}

// ============================================
// Town of Arkaoda - Socket Event Tipleri
// ============================================

import type { GameState, ChatMessage, NightAction, Vote, RoleName, GameLogEntry, WinnerTeam } from "./game"

// ---- Client -> Server Events ----

export interface ClientToServerEvents {
  // Oda olaylari
  "room:join": (data: { roomCode: string }) => void
  "room:leave": (data: { roomId: string }) => void
  "room:close": (data: { roomId: string }) => void

  // Bot olaylari
  "room:add-bot": (data: { roomId: string }) => void
  "room:remove-bot": (data: { roomId: string; botId: string }) => void

  // Oyun olaylari
  "game:start": (data: { roomId: string }) => void
  "game:night-action": (data: { targetId: string }) => void
  "game:gardiyan-action": (data: { targetId: string }) => void
  "game:vote": (data: { targetId: string | null }) => void

  // Chat olaylari
  "chat:send": (data: { message: string; channel: "PUBLIC" | "MAFIA" | "DEAD" }) => void
}

// ---- Server -> Client Events ----

export interface ServerToClientEvents {
  // Oda olaylari
  "room:updated": (data: { players: Array<{ id: string; userId: string; username: string; isConnected: boolean; isBot: boolean }> }) => void
  "room:error": (data: { message: string }) => void
  "room:closed": () => void

  // Oyun olaylari
  "game:state-update": (data: GameState) => void
  "game:role-assigned": (data: { role: RoleName; description: string }) => void
  "game:phase-change": (data: { phase: GameState["phase"]; dayCount: number; timer: number }) => void
  "game:player-eliminated": (data: { playerId: string; username: string; role: RoleName; reason: string }) => void
  "game:night-result": (data: { message: string }) => void
  "game:ended": (data: { winner: WinnerTeam; players: Array<{ id: string; username: string; role: RoleName; isAlive: boolean }> }) => void
  "game:vote-update": (data: { votes: Vote[] }) => void
  "game:log": (data: GameLogEntry) => void

  // Chat olaylari
  "chat:message": (data: ChatMessage) => void

  // Timer
  "timer:tick": (data: { seconds: number }) => void

  // Genel
  "error": (data: { message: string }) => void
}

// ---- Socket Data (internal) ----

export interface SocketData {
  userId: string
  username: string
  roomId: string | null
  playerId: string | null
}

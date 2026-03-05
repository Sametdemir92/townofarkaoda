// ============================================
// Town of Arkaoda - Oyun Tipleri
// ============================================

export type GamePhase = "lobby" | "night" | "day_discussion" | "day_voting" | "ended"

export type RoleName = "MAFYA" | "DOKTOR" | "DEDEKTIF" | "VATANDAS"

export type Team = "town" | "mafia"

export type ChatChannel = "PUBLIC" | "MAFIA" | "SYSTEM"

export type WinnerTeam = "town" | "mafia" | "draw"

// ---- Oyuncu ----

export interface Player {
  id: string
  userId: string
  username: string
  role: RoleName | null
  isAlive: boolean
  isConnected: boolean
  isBot: boolean
}

// ---- Oylar ----

export interface Vote {
  voterId: string
  targetId: string | null // null = oy kullanmadi
}

// ---- Gece Aksiyonlari ----

export interface NightAction {
  playerId: string
  role: RoleName
  targetId: string
}

export interface NightActionResult {
  type: "kill" | "heal" | "investigate"
  targetId: string
  success: boolean
  detail?: string
}

// ---- Oyun State ----

export interface GameState {
  roomId: string
  roomCode: string
  phase: GamePhase
  players: Player[]
  votes: Vote[]
  nightActions: NightAction[]
  dayCount: number
  hostId: string
  timer: number
  winner: WinnerTeam | null
  gameLog: GameLogEntry[]
  eliminatedTonight: string | null // gece oldurulen
  eliminatedToday: string | null   // gunduz oylanan
}

// ---- Mesajlar ----

export interface ChatMessage {
  id: string
  playerId: string
  username: string
  content: string
  channel: ChatChannel
  timestamp: number
}

// ---- Oyun Logu ----

export interface GameLogEntry {
  id: string
  dayCount: number
  phase: string
  action: string
  detail: string
  timestamp: number
}

// ---- Rol Tanimlari ----

export interface RoleDefinition {
  name: RoleName
  displayName: string
  team: Team
  description: string
  nightAbility: string | null
  emoji: string
}

export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  MAFYA: {
    name: "MAFYA",
    displayName: "Mafya",
    team: "mafia",
    description: "Geceleri kasaba halkini ortadan kaldiran suclular. Mafya uyeleri birbirini bilir ve gece birlikte karar verir.",
    nightAbility: "Bir oyuncuyu oldurmeye oy verir",
    emoji: "🔪",
  },
  DOKTOR: {
    name: "DOKTOR",
    displayName: "Doktor",
    team: "town",
    description: "Geceleri bir kisiyi koruyabilen kasaba doktoru. Dogru kisiye mudahale ederse o kisi geceden sag cikar.",
    nightAbility: "Bir oyuncuyu korur (kendisi dahil)",
    emoji: "💊",
  },
  DEDEKTIF: {
    name: "DEDEKTIF",
    displayName: "Dedektif",
    team: "town",
    description: "Geceleri bir kisinin rolunu arastiran ozel dedektif. Mafyayi bulmak icin en onemli rol.",
    nightAbility: "Bir oyuncunun rolunu ogrenr",
    emoji: "🔍",
  },
  VATANDAS: {
    name: "VATANDAS",
    displayName: "Vatandas",
    team: "town",
    description: "Siradan kasaba vatandasi. Ozel bir yetenegi yoktur ama gunduz oylamasi onun en buyuk silahidir.",
    nightAbility: null,
    emoji: "👤",
  },
}

// ---- Timer Sureler (saniye) ----

export const PHASE_DURATIONS: Record<string, number> = {
  night: 30,
  day_discussion: 60,
  day_voting: 30,
}

// ---- Oyuncu Limitleri ----

export const MIN_PLAYERS = 3 // Bot dahil minimum
export const MAX_PLAYERS = 15

// ---- Bot Isimleri ----

export const BOT_NAMES = [
  "Ayse", "Mehmet", "Zeynep", "Ali", "Fatma",
  "Hasan", "Elif", "Murat", "Selin", "Burak",
  "Deniz", "Cem", "Naz", "Kaan", "Defne",
]

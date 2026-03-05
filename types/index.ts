// ============================================
// Town of Arkaoda - Genel Tipler
// ============================================

export * from "./game"
export * from "./socket"

// ---- API Response Tipleri ----

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ---- Session Tipi ----

export interface SessionUser {
  id: string
  username: string
}

// ---- Room API Tipleri ----

export interface CreateRoomResponse {
  roomId: string
  roomCode: string
}

export interface JoinRoomResponse {
  roomId: string
  roomCode: string
  playerId: string
}

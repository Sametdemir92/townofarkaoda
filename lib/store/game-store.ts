// ============================================
// Zustand - Oyun State Store
// ============================================

"use client"

import { create } from "zustand"
import type { GameState, Player, Vote, GameLogEntry, RoleName, WinnerTeam, GamePhase } from "@/types/game"

interface GameStore {
  // State
  gameState: GameState | null
  myRole: RoleName | null
  myPlayerId: string | null
  nightResult: string | null
  isLoading: boolean

  // Actions
  setGameState: (state: GameState) => void
  setMyRole: (role: RoleName) => void
  setMyPlayerId: (id: string) => void
  setNightResult: (result: string | null) => void
  updatePhase: (phase: GamePhase, dayCount: number, timer: number) => void
  updateVotes: (votes: Vote[]) => void
  updateTimer: (seconds: number) => void
  eliminatePlayer: (playerId: string, role: RoleName) => void
  addGameLog: (entry: GameLogEntry) => void
  endGame: (winner: WinnerTeam, players: Player[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  gameState: null,
  myRole: null,
  myPlayerId: null,
  nightResult: null,
  isLoading: false,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),

  setMyRole: (role) => set({ myRole: role }),

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  setNightResult: (result) => set({ nightResult: result }),

  updatePhase: (phase, dayCount, timer) => {
    const state = get().gameState
    if (state) {
      set({
        gameState: { ...state, phase, dayCount, timer, votes: [], nightActions: [] },
        nightResult: null,
      })
    }
  },

  updateVotes: (votes) => {
    const state = get().gameState
    if (state) {
      set({ gameState: { ...state, votes } })
    }
  },

  updateTimer: (seconds) => {
    const state = get().gameState
    if (state) {
      set({ gameState: { ...state, timer: seconds } })
    }
  },

  eliminatePlayer: (playerId, role) => {
    const state = get().gameState
    if (state) {
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, isAlive: false, role } : p
      )
      set({ gameState: { ...state, players } })
    }
  },

  addGameLog: (entry) => {
    const state = get().gameState
    if (state) {
      set({ gameState: { ...state, gameLog: [...state.gameLog, entry] } })
    }
  },

  endGame: (winner, players) => {
    const state = get().gameState
    if (state) {
      set({
        gameState: {
          ...state,
          phase: "ended",
          winner,
          players: players.map((p) => ({
            ...p,
            isConnected: state.players.find((sp) => sp.id === p.id)?.isConnected ?? false,
          })),
        },
      })
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}))

// ============================================
// Gece Fazi Mantigi
// ============================================

import type { NightAction, NightActionResult, Player } from "@/types/game"
import { getRoleInstance } from "../roles"

export interface NightResolution {
  killedPlayerId: string | null
  healedPlayerId: string | null
  investigations: Map<string, string> // playerId -> "supheli" | "masum"
  results: NightActionResult[]
}

/**
 * Gece aksiyonlarini cozumler
 * Oncelik: Mafya oldurur -> Doktor korur -> Dedektif sorusturur
 */
export function resolveNightActions(
  nightActions: NightAction[],
  players: Player[]
): NightResolution {
  const alivePlayers = players.filter((p) => p.isAlive)
  const results: NightActionResult[] = []
  const investigations = new Map<string, string>()

  // --- Mafya Oylari ---
  // Tum mafyalarin hedeflerini topla, en cok oy alan olur
  const mafyaActions = nightActions.filter((a) => a.role === "MAFYA")
  const mafyaVotes = new Map<string, number>()

  for (const action of mafyaActions) {
    const count = mafyaVotes.get(action.targetId) || 0
    mafyaVotes.set(action.targetId, count + 1)
  }

  let killedPlayerId: string | null = null
  let maxVotes = 0

  mafyaVotes.forEach((count, targetId) => {
    if (count > maxVotes) {
      maxVotes = count
      killedPlayerId = targetId
    }
  })

  // --- Doktor Korumasi ---
  const doktorAction = nightActions.find((a) => a.role === "DOKTOR")
  let healedPlayerId: string | null = null

  if (doktorAction) {
    const role = getRoleInstance("DOKTOR")
    const result = role.performNightAction(
      doktorAction.playerId,
      doktorAction.targetId,
      alivePlayers
    )
    if (result) {
      healedPlayerId = doktorAction.targetId
      results.push(result)
    }
  }

  // Eger doktor mafyanin hedefini koruduysa, kimse olmez
  if (killedPlayerId && killedPlayerId === healedPlayerId) {
    killedPlayerId = null
  }

  if (killedPlayerId) {
    results.push({
      type: "kill",
      targetId: killedPlayerId,
      success: true,
    })
  }

  // --- Dedektif Sorusturmasi ---
  const dedektifAction = nightActions.find((a) => a.role === "DEDEKTIF")
  if (dedektifAction) {
    const role = getRoleInstance("DEDEKTIF")
    const result = role.performNightAction(
      dedektifAction.playerId,
      dedektifAction.targetId,
      alivePlayers
    )
    if (result) {
      investigations.set(dedektifAction.playerId, result.detail || "masum")
      results.push(result)
    }
  }

  return {
    killedPlayerId,
    healedPlayerId,
    investigations,
    results,
  }
}

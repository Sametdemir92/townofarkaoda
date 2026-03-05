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
  additionalKills: string[] // Ek olumler (orn: dedektif sucustu yakalanirsa)
}

/**
 * Gece aksiyonlarini cozumler
 * Oncelik: Mafya oldurur -> Doktor korur -> Dedektif sorusturur -> Ajan sorusturur
 */
export function resolveNightActions(
  nightActions: NightAction[],
  players: Player[],
  jailedPlayerId: string | null = null
): NightResolution {
  const alivePlayers = players.filter((p) => p.isAlive)
  const results: NightActionResult[] = []
  const investigations = new Map<string, string>()
  const additionalKills: string[] = []

  // Gardiyanin hapse attigi oyuncunun gece aksiyonlarini filtrele
  const effectiveActions = jailedPlayerId
    ? nightActions.filter((a) => a.playerId !== jailedPlayerId)
    : nightActions

  // --- Mafya Oylari ---
  const mafyaActions = effectiveActions.filter((a) => a.role === "MAFYA")
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
  const doktorAction = effectiveActions.find((a) => a.role === "DOKTOR")
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
  const dedektifAction = effectiveActions.find((a) => a.role === "DEDEKTIF")
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

    // Eger dedektif mafyanin oldurdugu kisiyi arastirdiysa,
    // dedektif sucustu yakalanir ve mafya onu da oldurur!
    if (killedPlayerId && dedektifAction.targetId === killedPlayerId) {
      additionalKills.push(dedektifAction.playerId)
      results.push({
        type: "kill",
        targetId: dedektifAction.playerId,
        success: true,
        detail: "Dedektif olay yerine gidince mafya tarafindan fark edildi ve o da olduruldu!",
      })
    }
  }

  // --- Ajan Sorusturmasi ---
  const ajanAction = effectiveActions.find((a) => a.role === "AJAN")
  if (ajanAction) {
    const target = alivePlayers.find((p) => p.id === ajanAction.targetId)
    if (target && target.role) {
      investigations.set(ajanAction.playerId, target.role)
      results.push({
        type: "investigate",
        targetId: ajanAction.targetId,
        success: true,
        detail: target.role,
      })
    }
  }

  return {
    killedPlayerId,
    healedPlayerId,
    investigations,
    results,
    additionalKills,
  }
}

// ============================================
// Kazanma Kosullari
// ============================================

import type { Player, WinnerTeam } from "@/types/game"

/**
 * Oyunun bitip bitmedigini kontrol eder
 * @returns Kazanan takim veya null (oyun devam)
 */
export function checkWinCondition(players: Player[]): WinnerTeam | null {
  const alivePlayers = players.filter((p) => p.isAlive)
  const aliveMafia = alivePlayers.filter((p) => p.role === "MAFYA")
  const aliveTown = alivePlayers.filter((p) => p.role !== "MAFYA")

  // Hayatta kimse kalmadi -> berabere
  if (alivePlayers.length === 0) {
    return "draw"
  }

  // Baskan oldu mu? Baskan olduyse mafya kazanir!
  const baskan = players.find((p) => p.role === "BASKAN")
  if (baskan && !baskan.isAlive) {
    return "mafia"
  }

  // Tum mafyalar oldu -> kasaba kazanir
  if (aliveMafia.length === 0) {
    return "town"
  }

  // Mafya sayisi >= kasaba sayisi -> mafya kazanir
  if (aliveMafia.length >= aliveTown.length) {
    return "mafia"
  }

  return null
}

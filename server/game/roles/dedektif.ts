// ============================================
// Dedektif Rolu
// ============================================

import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class DedektifRole extends BaseRole {
  readonly name = "DEDEKTIF" as const
  readonly displayName = "Dedektif"
  readonly team = "town" as const
  readonly description = "Geceleri bir kisinin rolunu arastiran ozel dedektif."
  readonly nightAbility = "Bir oyuncunun rolunu ogrenr"

  performNightAction(
    actorId: string,
    targetId: string,
    alivePlayers: Player[]
  ): NightActionResult | null {
    if (!this.isValidTarget(targetId, actorId, alivePlayers)) {
      return null
    }

    const target = alivePlayers.find((p) => p.id === targetId)
    if (!target) return null

    return {
      type: "investigate",
      targetId,
      success: true,
      detail: target.role === "MAFYA" ? "supheli" : "masum",
    }
  }

  canUseAbility(): boolean {
    return true
  }

  /**
   * Dedektif kendini sorusturamaz
   */
  isValidTarget(targetId: string, actorId: string, alivePlayers: Player[]): boolean {
    if (targetId === actorId) return false
    const target = alivePlayers.find((p) => p.id === targetId)
    if (!target || !target.isAlive) return false
    return true
  }
}

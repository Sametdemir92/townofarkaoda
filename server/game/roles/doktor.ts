// ============================================
// Doktor Rolu
// ============================================

import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class DoktorRole extends BaseRole {
  readonly name = "DOKTOR" as const
  readonly displayName = "Doktor"
  readonly team = "town" as const
  readonly description = "Geceleri bir kisiyi koruyabilen kasaba doktoru."
  readonly nightAbility = "Bir oyuncuyu korur (kendisi dahil)"

  performNightAction(
    actorId: string,
    targetId: string,
    alivePlayers: Player[]
  ): NightActionResult | null {
    if (!this.isValidTarget(targetId, actorId, alivePlayers)) {
      return null
    }

    return {
      type: "heal",
      targetId,
      success: true,
    }
  }

  canUseAbility(): boolean {
    return true
  }

  /**
   * Doktor kendini de koruyabilir
   */
  isValidTarget(targetId: string, _actorId: string, alivePlayers: Player[]): boolean {
    const target = alivePlayers.find((p) => p.id === targetId)
    if (!target || !target.isAlive) return false
    return true
  }
}

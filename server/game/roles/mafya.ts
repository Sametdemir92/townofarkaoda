// ============================================
// Mafya Rolu
// ============================================

import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class MafyaRole extends BaseRole {
  readonly name = "MAFYA" as const
  readonly displayName = "Mafya"
  readonly team = "mafia" as const
  readonly description = "Geceleri kasaba halkini ortadan kaldiran suclular."
  readonly nightAbility = "Bir oyuncuyu oldurmeye oy verir"

  performNightAction(
    actorId: string,
    targetId: string,
    alivePlayers: Player[]
  ): NightActionResult | null {
    if (!this.isValidTarget(targetId, actorId, alivePlayers)) {
      return null
    }

    return {
      type: "kill",
      targetId,
      success: true,
    }
  }

  canUseAbility(): boolean {
    return true
  }

  /**
   * Mafya kendini hedef alamaz, diger mafyayi da hedef alamaz
   */
  isValidTarget(targetId: string, actorId: string, alivePlayers: Player[]): boolean {
    if (targetId === actorId) return false
    const target = alivePlayers.find((p) => p.id === targetId)
    if (!target || !target.isAlive) return false
    if (target.role === "MAFYA") return false
    return true
  }
}

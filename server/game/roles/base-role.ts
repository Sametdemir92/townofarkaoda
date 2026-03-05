// ============================================
// Abstract Base Role
// ============================================

import type { RoleName, Team, Player, NightActionResult } from "@/types/game"

export abstract class BaseRole {
  abstract readonly name: RoleName
  abstract readonly displayName: string
  abstract readonly team: Team
  abstract readonly description: string
  abstract readonly nightAbility: string | null

  /**
   * Gece aksiyonunu gerceklestirir
   * @returns Aksiyon sonucu veya null (aksiyon yoksa)
   */
  abstract performNightAction(
    actorId: string,
    targetId: string,
    alivePlayers: Player[]
  ): NightActionResult | null

  /**
   * Bu rol gece aksiyon yapabilir mi?
   */
  abstract canUseAbility(): boolean

  /**
   * Gecerli hedef mi kontrol eder
   */
  isValidTarget(targetId: string, actorId: string, alivePlayers: Player[]): boolean {
    const target = alivePlayers.find((p) => p.id === targetId)
    if (!target) return false
    if (!target.isAlive) return false
    return true
  }
}

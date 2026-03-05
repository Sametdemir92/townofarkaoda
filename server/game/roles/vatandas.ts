// ============================================
// Vatandas Rolu
// ============================================

import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class VatandasRole extends BaseRole {
  readonly name = "VATANDAS" as const
  readonly displayName = "Vatandas"
  readonly team = "town" as const
  readonly description = "Siradan kasaba vatandasi. Ozel yetenegi yoktur."
  readonly nightAbility = null

  performNightAction(
    _actorId: string,
    _targetId: string,
    _alivePlayers: Player[]
  ): NightActionResult | null {
    // Vatandasin gece aksiyonu yok
    return null
  }

  canUseAbility(): boolean {
    return false
  }
}

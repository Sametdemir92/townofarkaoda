import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class BaskanRole extends BaseRole {
    name = "BASKAN" as const
    team = "town" as const
    displayName = "Başkan"
    description = "Kasabanın seçilmiş başkanı. Başkan öldüğü anda mafya otomatik olarak kazanır!"
    nightAbility = null

    canUseAbility(): boolean {
        return false // Başkan'ın gece aksiyonu yok.
    }

    performNightAction(
        playerId: string,
        targetId: string,
        players: Player[]
    ): NightActionResult | null {
        return null
    }
}

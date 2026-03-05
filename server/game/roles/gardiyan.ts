import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class GardiyanRole extends BaseRole {
    name = "GARDIYAN" as const
    team = "town" as const
    displayName = "Gardiyan"
    description = "Kasabanın gardiyanı. Gündüz tartışması sırasında birini seçer, o kişi o gece hiçbir aksiyon yapamaz."
    nightAbility = null

    canUseAbility(): boolean {
        return false // Gardiyanın gece aksiyonu yok, gündüz seçer
    }

    performNightAction(
        playerId: string,
        targetId: string,
        players: Player[]
    ): NightActionResult | null {
        return null
    }
}

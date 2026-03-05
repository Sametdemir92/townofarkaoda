import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class AjanRole extends BaseRole {
    name = "AJAN" as const
    team = "mafia" as const
    displayName = "Ajan"
    description = "Mafya için çalışan gizli ajan. Geceleri bir kişiyi araştırarak rolünü öğrenir."
    nightAbility = "Bir oyuncunun rolünü öğrenir"

    canUseAbility(): boolean {
        return true
    }

    performNightAction(
        playerId: string,
        targetId: string,
        players: Player[]
    ): NightActionResult | null {
        const target = players.find((p) => p.id === targetId)
        if (!target || !target.isAlive) return null

        return {
            type: "investigate",
            targetId,
            success: true,
            detail: target.role || "bilinmiyor",
        }
    }
}

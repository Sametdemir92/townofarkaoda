import { BaseRole } from "./base-role"
import type { Player, NightActionResult } from "@/types/game"

export class MedyumRole extends BaseRole {
    name = "MEDYUM" as const
    team = "town" as const
    displayName = "Medyum"
    description = "Ölülerin ruhlarıyla iletişim kurabilen kasabalı. Gündüz veya gece fark etmeksizin ölülerin sohbetini okuyabilir ve onlarla konuşabilir."
    nightAbility = null

    canUseAbility(): boolean {
        return false // Geceleri seçeceği bir eylem yok. Pasif bir rol.
    }

    performNightAction(
        playerId: string,
        targetId: string,
        players: Player[]
    ): NightActionResult | null {
        // Medyum'un geceleri seçeceği bir hedef eylemi yoktur. 
        // Ölülerin mesajlarını görebilme ve yazabilme pasif yeteneği vardır.
        return null
    }
}

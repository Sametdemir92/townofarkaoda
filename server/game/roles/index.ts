// ============================================
// Rol Registry
// ============================================

import type { RoleName, Player } from "@/types/game"
import { BaseRole } from "./base-role"
import { MafyaRole } from "./mafya"
import { DoktorRole } from "./doktor"
import { DedektifRole } from "./dedektif"
import { VatandasRole } from "./vatandas"

// Rol instance'lari
const roleInstances: Record<RoleName, BaseRole> = {
  MAFYA: new MafyaRole(),
  DOKTOR: new DoktorRole(),
  DEDEKTIF: new DedektifRole(),
  VATANDAS: new VatandasRole(),
}

export function getRoleInstance(roleName: RoleName): BaseRole {
  return roleInstances[roleName]
}

/**
 * Oyuncu sayisina gore rol dagitimi yapar
 * Formula: Mafya = floor(oyuncu/4), min 1
 *          Doktor = 1
 *          Dedektif = 1
 *          Vatandas = geri kalan
 */
export function assignRoles(players: Player[]): Player[] {
  const count = players.length
  const mafyaCount = Math.max(1, Math.floor(count / 4))
  const doktorCount = 1
  const dedektifCount = 1
  const vatandasCount = count - mafyaCount - doktorCount - dedektifCount

  // Rol listesi olustur
  const roles: RoleName[] = [
    ...Array(mafyaCount).fill("MAFYA"),
    ...Array(doktorCount).fill("DOKTOR"),
    ...Array(dedektifCount).fill("DEDEKTIF"),
    ...Array(vatandasCount).fill("VATANDAS"),
  ]

  // Karistir (Fisher-Yates shuffle)
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[roles[i], roles[j]] = [roles[j], roles[i]]
  }

  // Oyunculara ata
  return players.map((player, index) => ({
    ...player,
    role: roles[index],
  }))
}

export { BaseRole } from "./base-role"

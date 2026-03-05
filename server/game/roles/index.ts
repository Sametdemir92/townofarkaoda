// ============================================
// Rol Registry
// ============================================

import type { RoleName, Player } from "@/types/game"
import { BaseRole } from "./base-role"
import { MafyaRole } from "./mafya"
import { DoktorRole } from "./doktor"
import { DedektifRole } from "./dedektif"
import { VatandasRole } from "./vatandas"
import { MedyumRole } from "./medyum"

// Rol instance'lari
const roleInstances: Record<RoleName, BaseRole> = {
  MAFYA: new MafyaRole(),
  DOKTOR: new DoktorRole(),
  DEDEKTIF: new DedektifRole(),
  MEDYUM: new MedyumRole(),
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
  // Mafya sayisi
  const mafyaCount = Math.max(1, Math.floor(count / 4))

  // Baslangic olarak 1 Doktor, 1 Dedektif
  let doktorCount = 1
  let dedektifCount = 1
  let medyumCount = 0

  // Oyuncu sayisina gore rastgele ekstra ozel rol ekleme (birden fazla ayni rolu atayabilme)
  const extraRolesPossible = count > 5 ? count - (mafyaCount + 2) : 0
  if (extraRolesPossible > 0) {
    // Rastgele olarak fazladan doktor atansin (%30 sans)
    if (Math.random() < 0.3) {
      doktorCount += 1
    }
    // Rastgele olarak fazladan dedektif atansin (%30 sans)
    if (Math.random() < 0.3) {
      dedektifCount += 1
    }
    // Medyum atanma ihtimali (%40 sans - max 1 medyum yeterli genelde)
    if (Math.random() < 0.4) {
      medyumCount = 1
    }
  }

  // Ust limitleri asmamak icin guvenlik onlemi
  let tempVatandas = count - (mafyaCount + doktorCount + dedektifCount + medyumCount)
  if (tempVatandas < 0) {
    if (medyumCount > 0) { medyumCount--; tempVatandas++; }
    if (tempVatandas < 0 && doktorCount > 1) { doktorCount--; tempVatandas++; }
    if (tempVatandas < 0 && dedektifCount > 1) { dedektifCount--; tempVatandas++; }
  }
  const vatandasCount = Math.max(0, tempVatandas)

  // Rol listesi olustur
  const roles: RoleName[] = [
    ...Array(mafyaCount).fill("MAFYA"),
    ...Array(doktorCount).fill("DOKTOR"),
    ...Array(dedektifCount).fill("DEDEKTIF"),
    ...Array(medyumCount).fill("MEDYUM"),
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

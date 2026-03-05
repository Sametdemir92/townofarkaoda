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
import { BaskanRole } from "./baskan"
import { AjanRole } from "./ajan"
import { GardiyanRole } from "./gardiyan"

// Rol instance'lari
const roleInstances: Record<RoleName, BaseRole> = {
  MAFYA: new MafyaRole(),
  DOKTOR: new DoktorRole(),
  DEDEKTIF: new DedektifRole(),
  MEDYUM: new MedyumRole(),
  BASKAN: new BaskanRole(),
  AJAN: new AjanRole(),
  GARDIYAN: new GardiyanRole(),
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
  let baskanCount = count >= 5 ? 1 : 0 // 5+ oyuncuda her zaman 1 Baskan
  let ajanCount = 0
  let gardiyanCount = 0

  // Oyuncu sayisina gore rastgele ekstra ozel rol ekleme
  const extraRolesPossible = count > 5 ? count - (mafyaCount + 2 + baskanCount) : 0
  if (extraRolesPossible > 0) {
    // Medyum atanma ihtimali (%40 sans)
    if (Math.random() < 0.4) {
      medyumCount = 1
    }
    // Ajan: 6+ oyuncuda her zaman atanir
    if (count >= 6) {
      ajanCount = 1
    }
    // Gardiyan: 6+ oyuncuda her zaman atanir
    if (count >= 6) {
      gardiyanCount = 1
    }
  }

  // Ust limitleri asmamak icin guvenlik onlemi
  let tempVatandas = count - (mafyaCount + doktorCount + dedektifCount + medyumCount + baskanCount + ajanCount + gardiyanCount)
  if (tempVatandas < 0) {
    if (gardiyanCount > 0) { gardiyanCount--; tempVatandas++; }
    if (tempVatandas < 0 && ajanCount > 0) { ajanCount--; tempVatandas++; }
    if (tempVatandas < 0 && medyumCount > 0) { medyumCount--; tempVatandas++; }
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
    ...Array(baskanCount).fill("BASKAN"),
    ...Array(ajanCount).fill("AJAN"),
    ...Array(gardiyanCount).fill("GARDIYAN"),
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

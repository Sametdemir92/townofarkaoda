// ============================================
// Town of Arkaoda - Bot AI Karar Motoru
// ============================================

import type { Player, RoleName, NightAction, Vote } from "@/types/game"

// ---- Rastgele Secim Yardimcilari ----

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs)) + minMs
}

// ---- Gece Aksiyonu ----

/**
 * Bot icin gece aksiyonu karar verir
 * Rol bazli akilli secim yapar
 */
export function decideBotNightAction(
  bot: Player,
  allPlayers: Player[],
  previousActions: NightAction[]
): string | null {
  if (!bot.role || !bot.isAlive) return null

  const alivePlayers = allPlayers.filter((p) => p.isAlive)
  const aliveOthers = alivePlayers.filter((p) => p.id !== bot.id)

  switch (bot.role) {
    case "MAFYA": {
      // Mafya: Kasaba takimindaki birini rastgele sec
      // Doktor veya dedektifi hedef almaya oncelik ver (eger biliyorsa - bilemez ama rastgele isabet edebilir)
      const townPlayers = aliveOthers.filter((p) => p.role !== "MAFYA")
      if (townPlayers.length === 0) return null
      return randomPick(townPlayers).id
    }

    case "DOKTOR": {
      // Doktor: %30 ihtimalle kendini koru, %70 rastgele birini koru
      if (Math.random() < 0.3) return bot.id
      const others = alivePlayers.filter((p) => p.id !== bot.id)
      if (others.length === 0) return bot.id
      return randomPick(others).id
    }

    case "DEDEKTIF": {
      // Dedektif: Daha once sorusturmadigi birini sec
      const investigated = previousActions
        .filter((a) => a.playerId === bot.id && a.role === "DEDEKTIF")
        .map((a) => a.targetId)
      const uninvestigated = aliveOthers.filter((p) => !investigated.includes(p.id))
      if (uninvestigated.length > 0) {
        return randomPick(uninvestigated).id
      }
      if (aliveOthers.length > 0) {
        return randomPick(aliveOthers).id
      }
      return null
    }

    case "VATANDAS":
      return null // Vatandasin gece aksiyonu yok

    default:
      return null
  }
}

// ---- Oylama Karari ----

/**
 * Bot icin oylama karari verir
 * Basit strateji: Mafya ise kasabayi, kasaba ise rastgele birini sec
 */
export function decideBotVote(
  bot: Player,
  allPlayers: Player[],
  currentVotes: Vote[]
): string | null {
  if (!bot.role || !bot.isAlive) return null

  const alivePlayers = allPlayers.filter((p) => p.isAlive && p.id !== bot.id)
  if (alivePlayers.length === 0) return null

  // %15 ihtimalle kimseyi elememe oyu
  if (Math.random() < 0.15) return null

  switch (bot.role) {
    case "MAFYA": {
      // Mafya: Kasaba takimini hedef al, diger mafyaya oy verme
      // Bazen su anki en cok oy alana oy ver (suruden gitme)
      const townPlayers = alivePlayers.filter((p) => p.role !== "MAFYA")
      if (townPlayers.length === 0) return null

      // %40 ihtimalle en cok oy alan kasaba oyuncusuna at (su anki dalga)
      if (Math.random() < 0.4 && currentVotes.length > 0) {
        const voteCounts = new Map<string, number>()
        currentVotes.forEach((v) => {
          if (v.targetId) {
            voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1)
          }
        })
        let maxTarget: string | null = null
        let maxCount = 0
        voteCounts.forEach((count, target) => {
          const player = townPlayers.find((p) => p.id === target)
          if (player && count > maxCount) {
            maxCount = count
            maxTarget = target
          }
        })
        if (maxTarget) return maxTarget
      }

      return randomPick(townPlayers).id
    }

    case "DOKTOR":
    case "DEDEKTIF":
    case "VATANDAS": {
      // Kasaba: Rastgele birini sec
      // %50 ihtimalle mevcut en cok oy alan kisiye katil
      if (Math.random() < 0.5 && currentVotes.length > 0) {
        const voteCounts = new Map<string, number>()
        currentVotes.forEach((v) => {
          if (v.targetId) {
            voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1)
          }
        })
        let maxTarget: string | null = null
        let maxCount = 0
        voteCounts.forEach((count, target) => {
          const player = alivePlayers.find((p) => p.id === target)
          if (player && count > maxCount) {
            maxCount = count
            maxTarget = target
          }
        })
        if (maxTarget) return maxTarget
      }

      return randomPick(alivePlayers).id
    }

    default:
      return randomPick(alivePlayers).id
  }
}

// ---- Bot Chat Mesajlari ----

const BOT_DAY_MESSAGES: Record<string, string[]> = {
  general: [
    "Hmm, supheli biri var gibi...",
    "Kim mafya acaba?",
    "Dikkatli olmaliyiz.",
    "Gecen gece garip sesler duydum.",
    "Kimseye guvenemiyorum.",
    "Birisi yalan soyluyor, eminim.",
    "Iyi dusunelim, acele etmeyelim.",
    "Bence oylamamizi iyi kullanmaliyiz.",
    "Herkes supheli benim icin.",
    "Kasaba icin dogru karari vermeliyiz.",
  ],
  accuse: [
    "Bence {name} supheli.",
    "{name} cok sessiz, bu da supheli.",
    "{name}'e dikkat edin bence.",
    "Bir seyler gizliyor {name}.",
    "{name}'in davranislari garip.",
  ],
  defend: [
    "Ben masumum, yemin ederim!",
    "Beni elemek kasabanin zararina olur.",
    "Neden beni supheliyorsunuz ki?",
    "Mafya benim degilim, baska yere bakin.",
  ],
  afterDeath: [
    "Cok uzucu bir kayip...",
    "Katili bulmaliyiz!",
    "Bu gece daha dikkatli olmaliyiz.",
    "Mafya guclu, birlikte olmaliyiz.",
  ],
}

const BOT_MAFIA_MESSAGES = [
  "Kimi oldurmeliyiz?",
  "Doktoru hedef alalim.",
  "Dedektifi yok etmeliyiz.",
  "Sessiz birini secelim.",
  "Suphe cekmeyeni hedef alalim.",
]

/**
 * Bot icin chat mesaji uretir
 */
export function generateBotMessage(
  bot: Player,
  allPlayers: Player[],
  channel: "PUBLIC" | "MAFIA",
  context: "day_start" | "accuse" | "defend" | "after_death" | "mafia_night"
): string | null {
  // Her zaman mesaj gonderme - %40 ihtimal
  if (Math.random() > 0.4) return null

  if (channel === "MAFIA") {
    return randomPick(BOT_MAFIA_MESSAGES)
  }

  switch (context) {
    case "day_start":
      return randomPick(BOT_DAY_MESSAGES.general)

    case "accuse": {
      const others = allPlayers.filter((p) => p.isAlive && p.id !== bot.id && !p.isBot)
      if (others.length === 0) return randomPick(BOT_DAY_MESSAGES.general)
      const target = randomPick(others)
      return randomPick(BOT_DAY_MESSAGES.accuse).replace("{name}", target.username)
    }

    case "defend":
      return randomPick(BOT_DAY_MESSAGES.defend)

    case "after_death":
      return randomPick(BOT_DAY_MESSAGES.afterDeath)

    default:
      return randomPick(BOT_DAY_MESSAGES.general)
  }
}

/**
 * Bot aksiyonu icin gecikme suresi (ms)
 * Dogal gorunmesi icin rastgele gecikme
 */
export function getBotActionDelay(): number {
  return randomDelay(2000, 6000) // 2-6 saniye
}

export function getBotChatDelay(): number {
  return randomDelay(3000, 10000) // 3-10 saniye
}

export function getBotVoteDelay(): number {
  return randomDelay(3000, 12000) // 3-12 saniye
}

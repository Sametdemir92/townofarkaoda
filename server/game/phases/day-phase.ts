// ============================================
// Gunduz Fazi Mantigi
// ============================================

import type { Vote, Player } from "@/types/game"

export interface VoteResolution {
  eliminatedPlayerId: string | null
  voteCounts: Map<string, number>
  isTie: boolean
}

/**
 * Oylama sonuclarini cozumler
 * Cogunluk eler, beraberlikte kimse olmez
 */
export function resolveVotes(votes: Vote[], players: Player[]): VoteResolution {
  const alivePlayers = players.filter((p) => p.isAlive)
  const voteCounts = new Map<string, number>()

  // Oylari say
  for (const vote of votes) {
    if (vote.targetId) {
      // Gecerli hedef mi kontrol et
      const target = alivePlayers.find((p) => p.id === vote.targetId)
      if (target) {
        const count = voteCounts.get(vote.targetId) || 0
        voteCounts.set(vote.targetId, count + 1)
      }
    }
  }

  // Hic oy yoksa kimse elenmez
  if (voteCounts.size === 0) {
    return {
      eliminatedPlayerId: null,
      voteCounts,
      isTie: false,
    }
  }

  // En cok oy alani bul
  let maxVotes = 0
  let maxPlayerId: string | null = null
  let isTie = false

  voteCounts.forEach((count, playerId) => {
    if (count > maxVotes) {
      maxVotes = count
      maxPlayerId = playerId
      isTie = false
    } else if (count === maxVotes) {
      isTie = true
    }
  })

  // Beraberlikte kimse olmez
  if (isTie) {
    return {
      eliminatedPlayerId: null,
      voteCounts,
      isTie: true,
    }
  }

  return {
    eliminatedPlayerId: maxPlayerId,
    voteCounts,
    isTie: false,
  }
}

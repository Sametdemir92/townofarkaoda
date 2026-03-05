"use client"

import type { Player, Vote } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Vote as VoteIcon, Target, CheckCircle, Ban } from "lucide-react"

interface OylamaPaneliProps {
  players: Player[]
  votes: Vote[]
  myPlayerId: string
  myVote: string | null
  onVote: (targetId: string | null) => void
  isAlive: boolean
}

export function OylamaPaneli({
  players,
  votes,
  myPlayerId,
  myVote,
  onVote,
  isAlive,
}: OylamaPaneliProps) {
  const alivePlayers = players.filter((p) => p.isAlive && p.id !== myPlayerId)
  const aliveCount = players.filter((p) => p.isAlive).length

  const getVoteCount = (playerId: string) =>
    votes.filter((v) => v.targetId === playerId).length

  return (
    <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-700 dark:text-orange-300">
          <span className="flex items-center gap-2">
            <VoteIcon className="h-5 w-5" />
            Oylama
          </span>
          <Badge variant="outline" className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600">
            {votes.length}/{aliveCount} oy
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isAlive ? (
          <div className="text-center text-gray-500 py-4">
            Olu oyuncular oy kullanamaz
          </div>
        ) : (
          <>
            {/* Oy secenekleri */}
            {alivePlayers.map((player) => {
              const voteCount = getVoteCount(player.id)
              const isMyVote = myVote === player.id

              return (
                <button
                  key={player.id}
                  onClick={() => onVote(isMyVote ? null : player.id)}
                  className={`w-full flex items-center justify-between rounded-lg p-3 transition-all border ${isMyVote
                    ? "bg-orange-100 dark:bg-orange-600/30 ring-2 ring-orange-500 border-transparent text-gray-900 dark:text-white"
                    : "bg-white/80 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700/50 border-gray-100 dark:border-transparent text-gray-900 dark:text-white"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {player.username}
                    </span>
                    {isMyVote && (
                      <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {voteCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Badge variant="destructive" className="text-xs">
                          {voteCount} oy
                        </Badge>
                      </div>
                    )}
                    <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </button>
              )
            })}

            {/* Oy kullanmama secenegi */}
            <button
              onClick={() => onVote(null)}
              className={`w-full flex items-center justify-center gap-2 rounded-lg p-3 transition-all border outline-none ${myVote === null && votes.some((v) => v.voterId === myPlayerId)
                ? "bg-gray-200 dark:bg-gray-600/30 ring-2 ring-gray-500 border-transparent"
                : "bg-gray-100 dark:bg-gray-700/20 hover:bg-gray-200 dark:hover:bg-gray-700/30 border-gray-200 dark:border-transparent"
                }`}
            >
              <Ban className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Kimseyi Eleme</span>
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

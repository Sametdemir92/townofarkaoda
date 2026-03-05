"use client"

import type { Player, GamePhase, Vote } from "@/types/game"
import { Badge } from "@/components/ui/badge"
import { ROLE_DEFINITIONS } from "@/types/game"
import { Skull, Shield, Target, Bot } from "lucide-react"

interface OyuncuKartiProps {
  player: Player
  isMe: boolean
  phase: GamePhase
  votes: Vote[]
  myVote: string | null
  onSelect?: (playerId: string) => void
  selectable: boolean
  selectedTarget: string | null
}

export function OyuncuKarti({
  player,
  isMe,
  phase,
  votes,
  myVote,
  onSelect,
  selectable,
  selectedTarget,
}: OyuncuKartiProps) {
  const isSelected = selectedTarget === player.id
  const voteCount = votes.filter((v) => v.targetId === player.id).length
  const isVotedByMe = myVote === player.id

  // Rol bilgisi (sadece olu oyuncular veya oyun bittiyse)
  const roleInfo = player.role ? ROLE_DEFINITIONS[player.role] : null

  return (
    <button
      onClick={() => selectable && onSelect?.(player.id)}
      disabled={!selectable || isMe || !player.isAlive}
      className={`
        relative w-full text-left rounded-lg p-3 transition-all duration-200
        ${!player.isAlive ? "opacity-50 cursor-default" : ""}
        ${selectable && !isMe && player.isAlive ? "hover:bg-gray-700/50 cursor-pointer" : "cursor-default"}
        ${isSelected ? "ring-2 ring-red-500 bg-red-500/10" : "bg-gray-800/50"}
        ${isMe ? "border border-blue-500/30" : "border border-transparent"}
        ${isVotedByMe ? "ring-2 ring-yellow-500 bg-yellow-500/10" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Durum Gostergesi */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                player.isAlive
                  ? "bg-gray-700"
                  : "bg-red-900/30"
              }`}
            >
              {player.isAlive ? (
                roleInfo && !player.isAlive ? roleInfo.emoji : "👤"
              ) : (
                <Skull className="h-5 w-5 text-red-400" />
              )}
            </div>
            {/* Baglanti durumu */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                player.isConnected ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          </div>

          {/* Isim ve Bilgi */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${player.isAlive ? "text-white" : "text-gray-500 line-through"}`}>
                {player.username}
              </span>
              {isMe && (
                <Badge variant="secondary" className="text-xs py-0">
                  Sen
                </Badge>
              )}
              {player.isBot && (
                <Bot className="h-3.5 w-3.5 text-purple-400" />
              )}
            </div>
            {/* Rol goster (olu ise) */}
            {!player.isAlive && roleInfo && (
              <span className={`text-xs ${roleInfo.team === "mafia" ? "text-red-400" : "text-blue-400"}`}>
                {roleInfo.displayName}
              </span>
            )}
          </div>
        </div>

        {/* Sag Taraf */}
        <div className="flex items-center gap-2">
          {/* Oylama fazinda oy sayisi */}
          {phase === "day_voting" && voteCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {voteCount}
            </Badge>
          )}

          {/* Secili hedef gostergesi */}
          {isSelected && (
            <Badge variant="destructive" className="animate-pulse">
              Hedef
            </Badge>
          )}

          {/* Hayat durumu */}
          {player.isAlive ? (
            <Badge variant="alive" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Hayatta
            </Badge>
          ) : (
            <Badge variant="dead" className="text-xs">
              <Skull className="h-3 w-3 mr-1" />
              Elendi
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

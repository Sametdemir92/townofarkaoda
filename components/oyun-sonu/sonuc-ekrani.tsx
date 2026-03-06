"use client"

import type { Player, WinnerTeam, RoleName } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Skull, Shield, Home, X, Maximize2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { getSocket } from "@/lib/socket"

interface SonucEkraniProps {
  winner: WinnerTeam
  players: Array<{ id: string; username: string; role: RoleName; isAlive: boolean }>
  myPlayerId: string
  isHost?: boolean
  roomId?: string
}

export function SonucEkrani({ winner, players, myPlayerId, isHost, roomId }: SonucEkraniProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleEndGame = () => {
    if (isHost && roomId) {
      const socket = getSocket()
      socket.emit("room:close", { roomId })
    } else {
      router.push("/")
    }
  }

  const myPlayer = players.find((p) => p.id === myPlayerId)
  const didIWin = myPlayer
    ? (winner === "town" && ROLE_DEFINITIONS[myPlayer.role].team === "town") ||
      (winner === "mafia" && ROLE_DEFINITIONS[myPlayer.role].team === "mafia")
    : false

  const winnerText = winner === "town" ? "Kasaba Kazandi!" : winner === "mafia" ? "Mafya Kazandi!" : "Berabere!"
  const winnerColor = winner === "town" ? "text-blue-400" : winner === "mafia" ? "text-red-400" : "text-yellow-400"
  const winnerBg = winner === "town" ? "from-blue-900/20" : winner === "mafia" ? "from-red-900/20" : "from-yellow-900/20"

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full shadow-xl shadow-black/50 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
      >
        <Maximize2 className="h-4 w-4 mr-2" />
        Sonuclari Goster
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
      <div className="pointer-events-auto max-w-lg w-full space-y-4 animate-fade-in relative bg-gray-900/95 border border-gray-700 rounded-2xl p-6 shadow-[0_0_50px_-12px_rgba(0,0,0,1)]">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Sonuc Baslik */}
        <div className={`text-center space-y-4 bg-gradient-to-b ${winnerBg} to-transparent rounded-xl p-6`}>
          <Trophy className={`h-16 w-16 mx-auto ${winnerColor}`} />
          <h1 className={`text-4xl font-bold ${winnerColor}`}>{winnerText}</h1>
          {myPlayer && (
            <p className="text-lg">
              {didIWin ? (
                <span className="text-green-400">Tebrikler, kazandin!</span>
              ) : (
                <span className="text-red-400">Maalesef, kaybettin.</span>
              )}
            </p>
          )}
        </div>

        {/* Oyuncu Listesi + Roller */}
        <Card className="bg-gray-800/50 border-gray-700 max-h-[40vh] overflow-y-auto no-scrollbar">
          <CardHeader className="sticky top-0 bg-gray-900/90 z-10 backdrop-blur-sm border-b border-gray-700 pb-3">
            <CardTitle className="text-white">Tum Roller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {players.map((player) => {
              const roleInfo = ROLE_DEFINITIONS[player.role]
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    player.id === myPlayerId ? "bg-gray-700/50 ring-1 ring-blue-500/30" : "bg-gray-700/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roleInfo.emoji}</span>
                    <div>
                      <span className={`font-medium ${player.isAlive ? "text-white" : "text-gray-500"}`}>
                        {player.username}
                        {player.id === myPlayerId && " (Sen)"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleInfo.team === "mafia" ? "mafia" : "town"}>
                      {roleInfo.displayName}
                    </Badge>
                    {player.isAlive ? (
                      <Shield className="h-4 w-4 text-green-400" />
                    ) : (
                      <Skull className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Ana Sayfaya Don / Oyunu Bitir */}
        <div className="flex gap-3 pt-2">
          {isHost ? (
            <Button
              className="w-full bg-red-600 hover:bg-red-700 h-12"
              onClick={handleEndGame}
            >
              <Skull className="h-5 w-5 mr-2" />
              Tüm Oyuncularla Birlikte Oyunu Bitir
            </Button>
          ) : (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
              onClick={() => router.push("/")}
            >
              <Home className="h-5 w-5 mr-2" />
              Ana Sayfaya Don (Oyundan Ayril)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

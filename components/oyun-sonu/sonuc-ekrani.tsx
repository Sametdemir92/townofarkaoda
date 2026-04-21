"use client"

import { useEffect, useState, useMemo } from "react"
import type { WinnerTeam, RoleName } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Skull, Shield, Home, X, Maximize2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSocket } from "@/lib/socket"

interface SonucEkraniProps {
  winner: WinnerTeam
  players: Array<{ id: string; username: string; role: RoleName; isAlive: boolean }>
  myPlayerId: string
  isHost?: boolean
  roomId?: string
}

// Konfeti parçacıkları
function ConfettiEffect() {
  const confettiPieces = useMemo(() => {
    const colors = ["#fbbf24", "#60a5fa", "#34d399", "#f472b6", "#a78bfa", "#fb923c"]
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      size: `${8 + Math.random() * 8}px`,
      rotation: Math.random() * 360,
    }))
  }, [])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            "--delay": piece.delay,
            "--duration": piece.duration,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Fırtına efekti (mafya kazanınca)
function StormEffect() {
  return (
    <div className="storm-container">
      <div className="lightning" style={{ "--duration": "4s" } as React.CSSProperties} />
      <div className="lightning" style={{ "--duration": "7s", animationDelay: "2s" } as React.CSSProperties} />
      <div className="lightning" style={{ "--duration": "5s", animationDelay: "3.5s" } as React.CSSProperties} />
      {/* Kırmızı sis */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent animate-pulse-slow" />
    </div>
  )
}

export function SonucEkrani({ winner, players, myPlayerId, isHost, roomId }: SonucEkraniProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [revealedCount, setRevealedCount] = useState(0)

  // Stagger reveal for players
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= players.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 200)
    return () => clearInterval(interval)
  }, [isOpen, players.length])

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
    <>
      {/* Efektler */}
      {winner === "town" && <ConfettiEffect />}
      {winner === "mafia" && <StormEffect />}

      <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
        <div className="pointer-events-auto max-w-lg w-full space-y-4 animate-scale-in relative bg-gray-900/95 border border-gray-700 rounded-2xl p-6 shadow-[0_0_50px_-12px_rgba(0,0,0,1)]">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Sonuc Baslik */}
          <div className={`text-center space-y-4 bg-gradient-to-b ${winnerBg} to-transparent rounded-xl p-6`}>
            <Trophy className={`h-16 w-16 mx-auto ${winnerColor} animate-float`} />
            <h1
              className={`text-4xl font-bold ${winnerColor}`}
              style={{
                textShadow: winner === "town"
                  ? "0 0 30px rgba(96, 165, 250, 0.5)"
                  : winner === "mafia"
                    ? "0 0 30px rgba(239, 68, 68, 0.5)"
                    : "0 0 30px rgba(234, 179, 8, 0.5)",
              }}
            >
              {winnerText}
            </h1>
            {myPlayer && (
              <p className="text-lg animate-fade-in-slow">
                {didIWin ? (
                  <span className="text-green-400 font-bold">🎉 Tebrikler, kazandin!</span>
                ) : (
                  <span className="text-red-400 font-bold">💀 Maalesef, kaybettin.</span>
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
              {players.map((player, index) => {
                const roleInfo = ROLE_DEFINITIONS[player.role]
                const isRevealed = index < revealedCount

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between rounded-lg p-3 transition-all duration-500 ${
                      !isRevealed ? "opacity-0 translate-x-[-20px]" : "opacity-100 translate-x-0"
                    } ${
                      player.id === myPlayerId ? "bg-gray-700/50 ring-1 ring-blue-500/30" : "bg-gray-700/20"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
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
                className="w-full bg-red-600 hover:bg-red-700 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/30"
                onClick={handleEndGame}
              >
                <Skull className="h-5 w-5 mr-2" />
                Tüm Oyuncularla Birlikte Oyunu Bitir
              </Button>
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                onClick={() => router.push("/")}
              >
                <Home className="h-5 w-5 mr-2" />
                Ana Sayfaya Don (Oyundan Ayril)
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

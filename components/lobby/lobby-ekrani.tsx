"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Play, Crown, Bot, X, Plus } from "lucide-react"
import { useState } from "react"

interface LobbyPlayer {
  id: string
  userId: string
  username: string
  isConnected: boolean
  isBot: boolean
}

interface LobbyEkraniProps {
  roomCode: string
  roomId: string
  players: LobbyPlayer[]
  isHost: boolean
  currentUserId: string
  hostId: string
  onStartGame: () => void
  onAddBot: () => void
  onRemoveBot: (botId: string) => void
}

export function LobbyEkrani({
  roomCode,
  roomId,
  players,
  isHost,
  currentUserId,
  hostId,
  onStartGame,
  onAddBot,
  onRemoveBot,
}: LobbyEkraniProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canStart = players.length >= 3
  const botCount = players.filter((p) => p.isBot).length
  const realCount = players.filter((p) => !p.isBot).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Oda Bilgisi */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Bekleme Odasi</h2>

          {/* Oda Kodu */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400">Oda Kodu:</span>
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg px-4 py-2 transition-colors"
            >
              <span className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">
                {roomCode}
              </span>
              <Copy className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          {copied && (
            <span className="text-green-400 text-sm animate-fade-in">
              Kopyalandi!
            </span>
          )}
          <p className="text-gray-500 text-sm">
            Bu kodu paylasarak arkadaslarini davet edebilirsin
          </p>
        </div>

        {/* Oyuncu Listesi */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Oyuncular
              </span>
              <div className="flex items-center gap-2">
                {botCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    {botCount} Bot
                  </Badge>
                )}
                <Badge variant="outline" className="text-gray-300">
                  {players.length}/15
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    player.isBot
                      ? "bg-purple-900/20 border border-purple-500/20"
                      : "bg-gray-700/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        player.isBot
                          ? "bg-purple-500"
                          : player.isConnected
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="text-white font-medium">
                      {player.username}
                    </span>
                    {player.isBot && (
                      <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                        <Bot className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {!player.isBot && player.userId === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        Sen
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.userId === hostId && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                    {/* Bot cikarma butonu (sadece host) */}
                    {isHost && player.isBot && (
                      <button
                        onClick={() => onRemoveBot(player.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                        title="Botu cikar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Bos slotlar - 3'e kadar goster */}
              {players.length < 3 &&
                Array.from({ length: 3 - players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center bg-gray-700/10 rounded-lg px-4 py-3 border border-dashed border-gray-700"
                  >
                    <span className="text-gray-600 text-sm">
                      Oyuncu bekleniyor...
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Host Kontrolleri */}
        {isHost && (
          <div className="space-y-3">
            {/* Bot Ekle */}
            <Button
              variant="outline"
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
              onClick={onAddBot}
              disabled={players.length >= 15}
            >
              <Bot className="h-5 w-5 mr-2" />
              <Plus className="h-4 w-4 mr-1" />
              AI Oyuncu Ekle
              {players.length >= 15 && " (Oda dolu)"}
            </Button>

            {/* Oyunu Baslat */}
            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
              onClick={onStartGame}
              disabled={!canStart}
            >
              <Play className="h-5 w-5 mr-2" />
              {canStart
                ? `Oyunu Baslat (${players.length} oyuncu)`
                : `En az 3 oyuncu gerekli (${players.length}/3)`}
            </Button>
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-400">
            Oda sahibinin oyunu baslatmasini bekliyorsun...
          </div>
        )}

        {/* Bilgi */}
        <div className="text-center text-gray-600 text-xs space-y-1">
          <p>Minimum 3 oyuncu (bot dahil) ile oyun baslatilabilir.</p>
          <p>Onerilen: 5-10 oyuncu arasi en iyi deneyim.</p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Play, Crown, Bot, X, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { ChatPaneli } from "@/components/oyun/chat-paneli"
import type { ChatMessage, ChatChannel } from "@/types/game"

interface LobbyPlayer {
  id: string
  userId: string
  username: string
  isConnected: boolean
  isBot: boolean
}

interface LobbyEkraniProps {
  roomCode: string
  roomName?: string
  roomId: string
  players: LobbyPlayer[]
  isHost: boolean
  currentUserId: string
  hostId: string
  onStartGame: () => void
  onAddBot: () => void
  onRemoveBot: (botId: string) => void
  onSendMessage: (message: string, channel: ChatChannel) => void
  messages: ChatMessage[]
}

// Mum/Fener arka plan parçacıkları
function CandleParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Mum ışıkları */}
      <div className="absolute top-[20%] left-[10%] w-32 h-32 rounded-full bg-yellow-500/5 blur-3xl animate-pulse-slow" />
      <div className="absolute top-[50%] right-[8%] w-24 h-24 rounded-full bg-amber-500/5 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-[15%] left-[30%] w-28 h-28 rounded-full bg-orange-500/4 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      {/* Yavaş sis */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div
          className="absolute w-[200%] h-20 opacity-[0.02] bg-gradient-to-r from-transparent via-white to-transparent animate-drift"
          style={{ top: "30%" }}
        />
        <div
          className="absolute w-[200%] h-16 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent animate-drift-reverse"
          style={{ top: "60%", animationDelay: "5s" }}
        />
      </div>
    </div>
  )
}

export function LobbyEkrani({
  roomCode,
  roomName,
  roomId,
  players,
  isHost,
  currentUserId,
  hostId,
  onStartGame,
  onAddBot,
  onRemoveBot,
  onSendMessage,
  messages,
}: LobbyEkraniProps) {
  const [copied, setCopied] = useState(false)
  const [activeChannel, setActiveChannel] = useState<ChatChannel>("PUBLIC")
  const [mounted, setMounted] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyRoomLink = () => {
    const link = `${window.location.origin}/oda/${roomId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canStart = players.length >= 3
  const botCount = players.filter((p) => p.isBot).length
  const realCount = players.filter((p) => !p.isBot).length

  const handleStartGame = () => {
    setIsStarting(true)
    // Countdown animasyonu
    setCountdown(3)
    const c2 = setTimeout(() => setCountdown(2), 1000)
    const c1 = setTimeout(() => setCountdown(1), 2000)
    const go = setTimeout(() => {
      setCountdown(null)
      onStartGame()
    }, 3000)

    return () => {
      clearTimeout(c2)
      clearTimeout(c1)
      clearTimeout(go)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-colors relative overflow-hidden">
      {/* Mum Parçacıkları */}
      <CandleParticles />

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-2xl text-gray-400 font-medium mb-4 animate-fade-in">Oyun Başlıyor!</p>
            <span
              key={countdown}
              className="text-9xl font-black text-white animate-scale-in block"
              style={{
                textShadow: "0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.2)",
              }}
            >
              {countdown}
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto h-full">
        <div className="grid lg:grid-cols-2 gap-4 h-full">
          {/* Sol: Oda Bilgisi ve Oyuncular */}
          <div className="space-y-4">
            {/* Oda Bilgisi */}
            <Card className={`bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${mounted ? "animate-rise-up" : "opacity-0"}`}>
              <CardHeader>
                <CardTitle className="text-center text-3xl font-bold text-gray-900 dark:text-white">
                  {roomName || 'Bekleme Odasi'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Oda Linki */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Davet Linki:</span>
                  <button
                    onClick={copyRoomLink}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-lg px-4 py-2 transition-all duration-300 hover:shadow-md"
                  >
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 truncate max-w-[200px]">
                      Linki Kopyala
                    </span>
                    <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                {copied && (
                  <span className="text-green-600 dark:text-green-400 text-sm animate-scale-in block text-center">
                    ✅ Kopyalandi!
                  </span>
                )}
                <p className="text-gray-500 text-sm text-center">
                  Bu linki veya oyunu ana sayfadan bularak arkadaslarini davet edebilirsin
                </p>
              </CardContent>
            </Card>

            {/* Oyuncu Listesi */}
            <Card className={`bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${mounted ? "animate-rise-up" : "opacity-0"}`} style={{ animationDelay: "0.15s" }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
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
                    <Badge variant="outline" className="text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                      {players.length}/15
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`stagger-item flex items-center justify-between rounded-lg px-4 py-3 border transition-all duration-300 hover:shadow-sm ${player.isBot
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/20"
                          : "bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-transparent"
                        }`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${player.isBot
                              ? "bg-purple-500 animate-pulse"
                              : player.isConnected
                                ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
                                : "bg-gray-500"
                            }`}
                        />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {player.username}
                        </span>
                        {player.isBot && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-none">
                            AI
                          </Badge>
                        )}
                        {!player.isBot && player.userId === currentUserId && (
                          <Badge variant="secondary" className="text-xs border-none">
                            Sen
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {player.userId === hostId && (
                          <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-float" style={{ animationDuration: "4s" }} />
                        )}
                        {/* Bot cikarma butonu (sadece host) */}
                        {isHost && player.isBot && (
                          <button
                            onClick={() => onRemoveBot(player.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 hover:scale-110"
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
                        className="flex items-center bg-gray-50 dark:bg-gray-700/10 rounded-lg px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 animate-pulse-slow"
                      >
                        <span className="text-gray-500 dark:text-gray-600 text-sm">
                          Oyuncu bekleniyor...
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Host Kontrolleri */}
            {isHost && (
              <div className={`space-y-3 ${mounted ? "animate-rise-up" : "opacity-0"}`} style={{ animationDelay: "0.3s" }}>
                {/* Bot Ekle */}
                <Button
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-500/30 dark:text-purple-300 dark:hover:bg-purple-500/10 dark:hover:text-purple-200 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/10"
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
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg text-white disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-green-600/30"
                  onClick={handleStartGame}
                  disabled={!canStart || isStarting}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isStarting ? "Baslatiliyor..." : canStart
                    ? `Oyunu Baslat (${players.length} oyuncu)`
                    : `En az 3 oyuncu gerekli (${players.length}/3)`}
                </Button>
              </div>
            )}

            {!isHost && (
              <div className={`text-center text-gray-500 dark:text-gray-400 ${mounted ? "animate-fade-in-slow" : "opacity-0"}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                Oda sahibinin oyunu baslatmasini bekliyorsun...
              </div>
            )}

            {/* Bilgi */}
            <div className="text-center text-gray-400 dark:text-gray-600 text-xs space-y-1">
              <p>Minimum 3 oyuncu (bot dahil) ile oyun baslatilabilir.</p>
              <p>Onerilen: 5-10 oyuncu arasi en iyi deneyim.</p>
            </div>
          </div>

          {/* Sag: Chat */}
          <div className={`h-full ${mounted ? "animate-rise-up" : "opacity-0"}`} style={{ animationDelay: "0.2s" }}>
            <ChatPaneli
              messages={messages}
              activeChannel={activeChannel}
              onSendMessage={onSendMessage}
              onChannelChange={setActiveChannel}
              phase="lobby"
              myRole={null}
              isAlive={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
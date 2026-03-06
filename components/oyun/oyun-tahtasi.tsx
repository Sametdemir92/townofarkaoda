"use client"

import { useEffect, useState, useCallback } from "react"
import { useGameStore } from "@/lib/store/game-store"
import { useChatStore } from "@/lib/store/chat-store"
import { getSocket } from "@/lib/socket"
import type { GameState, ChatMessage, Player, Vote, GameLogEntry, RoleName, WinnerTeam, ChatChannel } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"

import { FazGostergesi } from "./faz-gostergesi"
import { Timer } from "./timer"
import { OyuncuKarti } from "./oyuncu-karti"
import { ChatPaneli } from "./chat-paneli"
import { GeceAksiyon } from "./gece-aksiyon"
import { OylamaPaneli } from "./oylama-paneli"
import { OyunLog } from "./oyun-log"
import { SonucEkrani } from "@/components/oyun-sonu/sonuc-ekrani"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Swords } from "lucide-react"

interface OyunTahtasiProps {
  roomId: string
  roomCode: string
  roomName?: string
  currentUserId: string
  isHost?: boolean
}

export function OyunTahtasi({ roomId, roomCode, roomName, currentUserId, isHost }: OyunTahtasiProps) {
  const socket = getSocket()
  const {
    gameState,
    myRole,
    myPlayerId,
    nightResult,
    setGameState,
    setMyRole,
    setMyPlayerId,
    setNightResult,
    updatePhase,
    updateVotes,
    updateTimer,
    eliminatePlayer,
    addGameLog,
    endGame,
  } = useGameStore()

  const { messages, activeChannel, addMessage, setActiveChannel } = useChatStore()

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [hasSubmittedAction, setHasSubmittedAction] = useState(false)
  const [endData, setEndData] = useState<{
    winner: WinnerTeam
    players: Array<{ id: string; username: string; role: RoleName; isAlive: boolean }>
  } | null>(null)

  // ---- Socket Event Listener'lari ----
  useEffect(() => {
    if (!socket.connected) return

    // Game state update
    socket.on("game:state-update", (state: GameState) => {
      setGameState(state)

      // myPlayerId'yi bul
      const me = state.players.find((p) => p.userId === currentUserId)
      if (me) {
        setMyPlayerId(me.id)
      }
    })

    // Rol atanmasi
    socket.on("game:role-assigned", ({ role, description }) => {
      setMyRole(role)
      addMessage({
        id: `system-role-${Date.now()}`,
        playerId: "system",
        username: "Sistem",
        content: `Rolun: ${ROLE_DEFINITIONS[role].emoji} ${ROLE_DEFINITIONS[role].displayName} - ${description}`,
        channel: "SYSTEM",
        timestamp: Date.now(),
      })
    })

    // Faz degisimi
    socket.on("game:phase-change", ({ phase, dayCount, timer }) => {
      updatePhase(phase, dayCount, timer)
      setSelectedTarget(null)
      setHasSubmittedAction(false)

      // Faz degisimi sistem mesaji
      const phaseNames: Record<string, string> = {
        night: "Gece basladi...",
        day_discussion: "Gunduz! Tartisma zamani.",
        day_voting: "Oylama basladi! Kimi elemek istiyorsunuz?",
        ended: "Oyun sona erdi!",
      }
      if (phaseNames[phase]) {
        addMessage({
          id: `system-phase-${Date.now()}`,
          playerId: "system",
          username: "Sistem",
          content: phaseNames[phase],
          channel: "SYSTEM",
          timestamp: Date.now(),
        })
      }
    })

    // Oyuncu elenmesi
    socket.on("game:player-eliminated", ({ playerId, username, role, reason }) => {
      eliminatePlayer(playerId, role)
      addMessage({
        id: `system-elim-${Date.now()}`,
        playerId: "system",
        username: "Sistem",
        content: `${username} elendi! (${ROLE_DEFINITIONS[role].displayName}) - ${reason}`,
        channel: "SYSTEM",
        timestamp: Date.now(),
      })
    })

    // Gece sonucu (dedektif)
    socket.on("game:night-result", ({ message }) => {
      setNightResult(message)
      addMessage({
        id: `system-night-${Date.now()}`,
        playerId: "system",
        username: "Sistem",
        content: message,
        channel: "SYSTEM",
        timestamp: Date.now(),
      })
    })

    // Oy guncellemesi
    socket.on("game:vote-update", ({ votes }) => {
      updateVotes(votes)
    })

    // Oyun sonu
    socket.on("game:ended", ({ winner, players }) => {
      setEndData({ winner, players })
    })

    // Chat mesaji
    socket.on("chat:message", (msg: ChatMessage) => {
      addMessage(msg)
    })

    // Timer
    socket.on("timer:tick", ({ seconds }) => {
      updateTimer(seconds)
    })

    // Oyun logu
    socket.on("game:log", (entry: GameLogEntry) => {
      addGameLog(entry)
    })

    // Hata
    socket.on("error", ({ message }) => {
      addMessage({
        id: `error-${Date.now()}`,
        playerId: "system",
        username: "Hata",
        content: message,
        channel: "SYSTEM",
        timestamp: Date.now(),
      })
    })

    return () => {
      socket.off("game:state-update")
      socket.off("game:role-assigned")
      socket.off("game:phase-change")
      socket.off("game:player-eliminated")
      socket.off("game:night-result")
      socket.off("game:vote-update")
      socket.off("game:ended")
      socket.off("chat:message")
      socket.off("timer:tick")
      socket.off("game:log")
      socket.off("error")
    }
  }, [socket.connected])

  // ---- Handlers ----

  const handleNightAction = useCallback(() => {
    if (selectedTarget && !hasSubmittedAction) {
      socket.emit("game:night-action", { targetId: selectedTarget })
      setHasSubmittedAction(true)
    }
  }, [selectedTarget, hasSubmittedAction, socket])

  const handleGardiyanAction = useCallback((targetId: string) => {
    if (gameState?.phase === "day_discussion" && myRole === "GARDIYAN") {
      socket.emit("game:gardiyan-action", { targetId })
      setHasSubmittedAction(true)
    }
  }, [gameState?.phase, myRole, socket])

  const handleVote = useCallback(
    (targetId: string | null) => {
      socket.emit("game:vote", { targetId })
    },
    [socket]
  )

  const handleSendMessage = useCallback(
    (message: string, channel: ChatChannel) => {
      if (channel === "SYSTEM") return // Sistem mesajlari gonderilemez
      socket.emit("chat:send", { message, channel })
    },
    [socket]
  )

  // ---- Oyun Sonu ----
  const renderSonucEkrani = () => {
    if (!endData) return null
    return (
      <SonucEkrani
        winner={endData.winner}
        players={endData.players}
        myPlayerId={myPlayerId || ""}
        isHost={isHost || false}
        roomId={roomId}
      />
    )
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg text-gray-400">Oyun yukleniyor...</div>
      </div>
    )
  }

  const me = gameState.players.find((p) => p.id === myPlayerId)
  const isAlive = me?.isAlive ?? false
  const myVote = gameState.votes.find((v) => v.voterId === myPlayerId)?.targetId ?? null

  // Faz sinifi
  const phaseClass =
    gameState.phase === "night"
      ? "phase-night"
      : gameState.phase === "day_voting"
        ? "phase-voting"
        : gameState.phase.startsWith("day")
          ? "phase-day"
          : ""

  return (
    <div className={`min-h-screen transition-all duration-1000 ${phaseClass} ${!phaseClass ? "bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" : ""}`}>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700/50 backdrop-blur-sm bg-white/50 dark:bg-black/20 p-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="h-5 w-5 text-red-600 dark:text-red-500" />
            <span className="font-bold text-gray-900 dark:text-white">Town of Arkaoda</span>
            <Badge variant="outline" className="text-gray-600 dark:text-gray-300">
              {roomName || roomCode}
            </Badge>
          </div>

          <FazGostergesi phase={gameState.phase} dayCount={gameState.dayCount} />

          {/* Rol Badge */}
          {myRole && (
            <div className="flex items-center gap-2 group cursor-default">
              <span className="text-gray-400 text-xs hidden sm:block uppercase tracking-wider font-bold">Rolün:</span>
              <Badge
                variant={ROLE_DEFINITIONS[myRole].team === "mafia" ? "mafia" : "town"}
                className={`text-sm px-2 py-1 pr-3 shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-105 ${ROLE_DEFINITIONS[myRole].team === "mafia" ? "hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"}`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden mr-2 border border-white/20 inline-block bg-black align-middle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/roles/${myRole.toLowerCase()}.png`}
                    alt={myRole}
                    className="w-full h-full object-cover animate-pulse"
                  />
                </div>
                {ROLE_DEFINITIONS[myRole].displayName}
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* Timer */}
      {gameState.timer > 0 && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <Timer seconds={gameState.timer} phase={gameState.phase} />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Sol: Oyuncu Listesi */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Oyuncular ({gameState.players.filter((p) => p.isAlive).length}/{gameState.players.length})
            </h3>
            <div className="space-y-1.5">
              {gameState.players.map((player) => (
                <OyuncuKarti
                  key={player.id}
                  player={player}
                  isMe={player.id === myPlayerId}
                  phase={gameState.phase}
                  votes={gameState.votes}
                  myVote={myVote}
                  onSelect={(id) => {
                    if (gameState.phase === "day_voting") {
                      handleVote(id)
                    } else if (gameState.phase === "night") {
                      setSelectedTarget(id)
                    } else if (gameState.phase === "day_discussion" && myRole === "GARDIYAN" && isAlive) {
                      handleGardiyanAction(id)
                    }
                  }}
                  selectable={
                    (gameState.phase === "day_voting" && isAlive) ||
                    (gameState.phase === "night" && isAlive && myRole !== "VATANDAS" && myRole !== "BASKAN" && myRole !== "GARDIYAN" && !hasSubmittedAction) ||
                    (gameState.phase === "day_discussion" && isAlive && myRole === "GARDIYAN" && !hasSubmittedAction && player.id !== myPlayerId)
                  }
                  selectedTarget={selectedTarget || (gameState.phase === "day_discussion" && myRole === "GARDIYAN" && gameState.jailedPlayerId === player.id ? player.id : null)}
                />
              ))}
            </div>
          </div>

          {/* Orta: Aksiyon Alani */}
          <div className="lg:col-span-1 space-y-4">
            {/* Gece Aksiyonu */}
            {gameState.phase === "night" && myRole && isAlive && (
              <GeceAksiyon
                myRole={myRole}
                players={gameState.players}
                myPlayerId={myPlayerId || ""}
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
                onConfirm={handleNightAction}
                nightResult={nightResult}
                hasSubmitted={hasSubmittedAction}
              />
            )}

            {/* Oylama */}
            {gameState.phase === "day_voting" && (
              <OylamaPaneli
                players={gameState.players}
                votes={gameState.votes}
                myPlayerId={myPlayerId || ""}
                myVote={myVote}
                onVote={handleVote}
                isAlive={isAlive}
              />
            )}

            {/* Tartisma fazinda bilgi */}
            {gameState.phase === "day_discussion" && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-500/30 shadow-sm">
                <CardContent className="p-4 text-center">
                  {nightResult && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 text-blue-800 dark:text-blue-300 text-sm mb-3 text-left">
                      <span className="font-semibold">🔍 Gece Soruşturma Sonucu:</span> {nightResult}
                    </div>
                  )}
                  <p className="text-yellow-700 dark:text-yellow-300">Tartisma zamani! Suphelilerini paylas.</p>
                  <p className="text-sm text-yellow-600/80 dark:text-gray-400 mt-1">
                    Oylama sure bitiminde baslayacak.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Gece - canli degilse */}
            {gameState.phase === "night" && !isAlive && (
              <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center text-gray-500">
                  Elendin. Oyunu izliyorsun...
                </CardContent>
              </Card>
            )}

            {/* Oyun Logu */}
            <OyunLog logs={gameState.gameLog} />
          </div>

          {/* Sag: Chat */}
          <div className="lg:col-span-1">
            <ChatPaneli
              messages={messages}
              activeChannel={activeChannel}
              onSendMessage={handleSendMessage}
              onChannelChange={setActiveChannel}
              phase={gameState.phase}
              myRole={myRole}
              isAlive={isAlive}
            />
          </div>
        </div>
      </div>

      {/* Pop-up Modal */}
      {renderSonucEkrani()}
    </div>
  )
}

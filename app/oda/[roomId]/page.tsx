"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket"
import { useGameStore } from "@/lib/store/game-store"
import { useChatStore } from "@/lib/store/chat-store"
import { LobbyEkrani } from "@/components/lobby/lobby-ekrani"
import { OyunTahtasi } from "@/components/oyun/oyun-tahtasi"

interface RoomData {
  id: string
  code: string
  hostId: string
  status: string
  isHost: boolean
  players: Array<{
    id: string
    userId: string
    username: string
    isAlive: boolean
  }>
}

export default function OdaPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [lobbyPlayers, setLobbyPlayers] = useState<
    Array<{ id: string; userId: string; username: string; isConnected: boolean; isBot: boolean }>
  >([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState("")
  const [gameStarted, setGameStarted] = useState(false)

  const { gameState, reset: resetGameStore } = useGameStore()
  const { clearMessages } = useChatStore()

  const userId = (session?.user as any)?.id
  const username = (session?.user as any)?.username || session?.user?.name

  // ---- Auth kontrolu ----
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/giris")
    }
  }, [sessionStatus, router])

  // ---- Oda verisini getir ----
  useEffect(() => {
    if (!userId) return

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`)
        const data = await res.json()

        if (data.success) {
          setRoomData(data.data)
          setLobbyPlayers(
            data.data.players.map((p: any) => ({
              ...p,
              isConnected: true,
              isBot: p.isBot ?? false,
            }))
          )
          if (data.data.status === "PLAYING") {
            setGameStarted(true)
          }
        } else {
          setError(data.error || "Oda bulunamadi")
        }
      } catch {
        setError("Baglanti hatasi")
      }
    }

    fetchRoom()
  }, [roomId, userId])

  // ---- Socket Baglantisi ----
  useEffect(() => {
    if (!userId || !username || !roomData) return

    // Token olustur (basit format)
    const token = `${userId}:${username}`

    const socket = connectSocket(token)

    socket.on("connect", () => {
      setIsConnected(true)
      // Odaya katil
      socket.emit("room:join", { roomCode: roomData.code })
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    // Oda guncellemesi (lobby)
    socket.on("room:updated", ({ players }) => {
      if (players.length > 0) {
        setLobbyPlayers(players)
      }
    })

    // Oda hatasi
    socket.on("room:error", ({ message }) => {
      setError(message)
    })

    // Oyun state gelirse oyun baslamis demektir
    socket.on("game:state-update", () => {
      setGameStarted(true)
    })

    socket.on("game:phase-change", () => {
      setGameStarted(true)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("room:updated")
      socket.off("room:error")
      socket.off("game:state-update")
      socket.off("game:phase-change")
      disconnectSocket()
      resetGameStore()
      clearMessages()
    }
  }, [userId, username, roomData?.id])

  // ---- Oyunu Baslat ----
  const handleStartGame = useCallback(() => {
    const socket = getSocket()
    if (socket.connected && roomId) {
      socket.emit("game:start", { roomId })
    }
  }, [roomId])

  // ---- Bot Ekle ----
  const handleAddBot = useCallback(() => {
    const socket = getSocket()
    if (socket.connected && roomId) {
      socket.emit("room:add-bot", { roomId })
    }
  }, [roomId])

  // ---- Bot Cikar ----
  const handleRemoveBot = useCallback((botId: string) => {
    const socket = getSocket()
    if (socket.connected && roomId) {
      socket.emit("room:remove-bot", { roomId, botId })
    }
  }, [roomId])

  // ---- Loading / Error States ----

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="animate-pulse text-lg text-gray-600 dark:text-gray-400">Yukleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="text-center space-y-4">
          <div className="text-red-500 dark:text-red-400 text-lg">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 dark:text-blue-400 hover:underline"
          >
            Ana sayfaya don
          </button>
        </div>
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="animate-pulse text-lg text-gray-600 dark:text-gray-400">Oda yukleniyor...</div>
      </div>
    )
  }

  // ---- Oyun Basladi mi? ----
  if (gameStarted) {
    return (
      <OyunTahtasi
        roomId={roomId}
        roomCode={roomData.code}
        currentUserId={userId}
      />
    )
  }

  // ---- Lobby ----
  return (
    <LobbyEkrani
      roomCode={roomData.code}
      roomId={roomId}
      players={lobbyPlayers}
      isHost={roomData.isHost}
      currentUserId={userId}
      hostId={roomData.hostId}
      onStartGame={handleStartGame}
      onAddBot={handleAddBot}
      onRemoveBot={handleRemoveBot}
    />
  )
}

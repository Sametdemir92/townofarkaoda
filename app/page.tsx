"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, LogIn, LogOut, Swords, List } from "lucide-react"
import { ModeToggle } from "@/components/theme-toggle"

interface Room {
  id: string
  code: string
  playerCount: number
  maxPlayers: number
  createdAt: string
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [openRooms, setOpenRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms")
      const data = await res.json()
      if (data.success) {
        setOpenRooms(data.data)
      }
    } catch (err) {
      console.error("Odalar getirilemedi", err)
    } finally {
      setIsLoadingRooms(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchRooms()
      // Her 10 saniyede bir odayi yenile
      const interval = setInterval(fetchRooms, 10000)
      return () => clearInterval(interval)
    }
  }, [status])

  // Giris yapmamissa yonlendir
  if (status === "unauthenticated") {
    router.push("/auth/giris")
    return null
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Yukleniyor...</div>
      </div>
    )
  }

  const handleCreateRoom = async () => {
    setIsCreating(true)
    setError("")

    try {
      const res = await fetch("/api/rooms", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        router.push(`/oda/${data.data.roomId}`)
      } else {
        setError(data.error || "Oda olusturulamadi")
      }
    } catch {
      setError("Baglanti hatasi")
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || roomCode).trim().toUpperCase()

    if (!code) {
      setError("Oda kodu gerekli")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      const res = await fetch(`/api/rooms?code=${code}`)
      const data = await res.json()

      if (data.success && data.data.length > 0) {
        const room = data.data.find((r: any) => r.code === code)
        if (room) {
          router.push(`/oda/${room.id}`)
        } else {
          setError("Oda bulunamadi")
        }
      } else {
        // Direkt kod ile gitmeyi dene
        router.push(`/oda/${code}`)
      }
    } catch {
      setError("Baglanti hatasi")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-transparent backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-red-600 dark:text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Town of Arkaoda</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Hosgeldin, <span className="text-gray-900 dark:text-white font-medium">{(session?.user as any)?.username || session?.user?.name}</span>
            </span>
            <ModeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth/giris" })} className="text-gray-600 dark:text-gray-300">
              <LogOut className="h-4 w-4 mr-1" />
              Cikis
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Town of Arkaoda
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Kasabada bir katil var... Onu bulabilecek misin?
            </p>
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Oda Olustur */}
            <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Plus className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  Oda Olustur
                </CardTitle>
                <CardDescription>
                  Yeni bir oyun odasi olustur ve arkadaslarini davet et
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? "Olusturuluyor..." : "Yeni Oda Olustur"}
                </Button>
              </CardContent>
            </Card>

            {/* Odaya Katil */}
            <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <LogIn className="h-5 w-5 text-green-500 dark:text-green-400" />
                  Odaya Katil
                </CardTitle>
                <CardDescription>
                  Oda kodunu girerek mevcut bir oyuna katil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Oda kodunu gir (ornek: ABC123)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  maxLength={6}
                  className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white uppercase tracking-widest text-center text-lg"
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleJoinRoom()}
                  disabled={isJoining || !roomCode.trim()}
                >
                  {isJoining ? "Katiliniyor..." : "Odaya Katil"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center text-red-600 dark:text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Acik Odalar Listesi */}
          <Card className="bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <List className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                Acik Odalar
              </CardTitle>
              <CardDescription>
                Bekleyen oyunlara hizlica katil
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRooms ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4 animate-pulse">
                  Odalar yukleniyor...
                </div>
              ) : openRooms.length === 0 ? (
                <div className="text-center text-gray-600 dark:text-gray-500 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p>Su an acik bir oda bulunmuyor.</p>
                  <p className="text-sm mt-1">Hemen yeni bir oda olusturabilirsin!</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {openRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-900 rounded text-xs font-mono text-gray-800 dark:text-white tracking-widest">
                            {room.code}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.playerCount} / {room.maxPlayers} Oyuncu
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="default"
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs text-white"
                        onClick={() => handleJoinRoom(room.code)}
                        disabled={isJoining || room.playerCount >= room.maxPlayers}
                      >
                        {room.playerCount >= room.maxPlayers ? "Oda Dolu" : "Katil"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roller Bilgi */}
          <Card className="bg-white/60 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: "Mafya", emoji: "🔪", desc: "Geceleri oldurur", color: "text-red-500 dark:text-red-400" },
                  { name: "Doktor", emoji: "💊", desc: "Geceleri korur", color: "text-green-500 dark:text-green-400" },
                  { name: "Dedektif", emoji: "🔍", desc: "Geceleri sorusturur", color: "text-blue-500 dark:text-blue-400" },
                  { name: "Vatandas", emoji: "👤", desc: "Oylama gucu", color: "text-gray-500 dark:text-gray-400" },
                ].map((role) => (
                  <div
                    key={role.name}
                    className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 text-center space-y-1 shadow-sm border border-gray-100 dark:border-transparent"
                  >
                    <div className="text-2xl">{role.emoji}</div>
                    <div className={`font-medium ${role.color}`}>{role.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{role.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

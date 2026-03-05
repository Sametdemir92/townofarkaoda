"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, LogIn, LogOut, Swords } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")

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

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError("Oda kodu gerekli")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      // Oda kodunu buyuk harfe cevir ve bosluklari temizle
      const code = roomCode.trim().toUpperCase()

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
        router.push(`/oda/${roomCode.trim()}`)
      }
    } catch {
      setError("Baglanti hatasi")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold text-white">Town of Arkaoda</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Hosgeldin, <span className="text-white font-medium">{(session?.user as any)?.username || session?.user?.name}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" />
              Cikis
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-white">
              Town of Arkaoda
            </h2>
            <p className="text-gray-400 text-lg">
              Kasabada bir katil var... Onu bulabilecek misin?
            </p>
          </div>

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Oda Olustur */}
            <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-blue-400" />
                  Oda Olustur
                </CardTitle>
                <CardDescription>
                  Yeni bir oyun odasi olustur ve arkadaslarini davet et
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? "Olusturuluyor..." : "Yeni Oda Olustur"}
                </Button>
              </CardContent>
            </Card>

            {/* Odaya Katil */}
            <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LogIn className="h-5 w-5 text-green-400" />
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
                  className="bg-gray-700/50 border-gray-600 text-white uppercase tracking-widest text-center text-lg"
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleJoinRoom}
                  disabled={isJoining || !roomCode.trim()}
                >
                  {isJoining ? "Katiliniyor..." : "Odaya Katil"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Roller Bilgi */}
          <Card className="bg-gray-800/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: "Mafya", emoji: "🔪", desc: "Geceleri oldurur", color: "text-red-400" },
                  { name: "Doktor", emoji: "💊", desc: "Geceleri korur", color: "text-green-400" },
                  { name: "Dedektif", emoji: "🔍", desc: "Geceleri sorusturur", color: "text-blue-400" },
                  { name: "Vatandas", emoji: "👤", desc: "Oylama gucu", color: "text-gray-400" },
                ].map((role) => (
                  <div
                    key={role.name}
                    className="bg-gray-700/30 rounded-lg p-3 text-center space-y-1"
                  >
                    <div className="text-2xl">{role.emoji}</div>
                    <div className={`font-medium ${role.color}`}>{role.name}</div>
                    <div className="text-xs text-gray-500">{role.desc}</div>
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

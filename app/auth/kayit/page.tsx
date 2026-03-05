"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Swords } from "lucide-react"

export default function KayitPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError("Sifreler eslesmiyor")
      return
    }

    if (username.length < 3 || username.length > 20) {
      setError("Kullanici adi 3-20 karakter olmali")
      return
    }

    if (password.length < 4) {
      setError("Sifre en az 4 karakter olmali")
      return
    }

    setIsLoading(true)

    try {
      // Kayit
      const res = await fetch("/api/auth/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Kayit basarisiz")
        return
      }

      // Otomatik giris
      const signInResult = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Kayit basarili ama giris yapilamadi, giris sayfasina yonlendir
        router.push("/auth/giris")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Kayit sirasinda hata olustu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Swords className="h-10 w-10 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-white">Kayit Ol</CardTitle>
          <CardDescription>Yeni bir hesap olustur</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Kullanici Adi</label>
              <Input
                type="text"
                placeholder="En az 3 karakter"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
                required
                autoFocus
                minLength={3}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Sifre</label>
              <Input
                type="password"
                placeholder="En az 4 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
                required
                minLength={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Sifre Tekrar</label>
              <Input
                type="password"
                placeholder="Sifrenizi tekrar girin"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center text-red-400 text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Kayit yapiliyor..." : "Kayit Ol"}
            </Button>
            <p className="text-sm text-gray-400">
              Zaten hesabin var mi?{" "}
              <Link href="/auth/giris" className="text-blue-400 hover:underline">
                Giris Yap
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

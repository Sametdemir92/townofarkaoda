"use client"

import { useEffect, useState } from "react"
import type { GamePhase } from "@/types/game"

interface FazGecisAnimasyonuProps {
  phase: GamePhase
  previousPhase: GamePhase | null
}

const phaseMessages: Partial<Record<GamePhase, { title: string; subtitle: string; theme: string }>> = {
  night: {
    title: "Gece Çöküyor...",
    subtitle: "Herkes gözlerini kapatsın",
    theme: "night",
  },
  day_discussion: {
    title: "Gün Ağarıyor...",
    subtitle: "Kasaba uyanıyor",
    theme: "day",
  },
  day_voting: {
    title: "Kasaba Toplanıyor!",
    subtitle: "Şüphelini seç ve oy ver",
    theme: "voting",
  },
}

export function FazGecisAnimasyonu({ phase, previousPhase }: FazGecisAnimasyonuProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

  const message = phaseMessages[phase]

  useEffect(() => {
    if (!message || phase === previousPhase) return

    // Yıldızlar oluştur (gece fazı için)
    if (phase === "night") {
      const newStars = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 3,
      }))
      setStars(newStars)
    }

    setVisible(true)
    setExiting(false)

    // 2.5 saniye sonra çıkış animasyonu başlat
    const exitTimeout = setTimeout(() => {
      setExiting(true)
    }, 2500)

    // 3.3 saniye sonra tamamen çıkar
    const hideTimeout = setTimeout(() => {
      setVisible(false)
      setExiting(false)
    }, 3300)

    return () => {
      clearTimeout(exitTimeout)
      clearTimeout(hideTimeout)
    }
  }, [phase])

  if (!visible || !message) return null

  const bgGradient =
    message.theme === "night"
      ? "from-indigo-950 via-slate-900 to-black"
      : message.theme === "day"
        ? "from-amber-900 via-orange-800 to-yellow-900"
        : "from-red-950 via-red-900 to-orange-950"

  return (
    <div
      className={`phase-transition-overlay ${exiting ? "exiting" : ""}`}
    >
      {/* Arka Plan Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`} />

      {/* Gece yıldızları */}
      {message.theme === "night" && (
        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                "--duration": `${2 + star.delay}s`,
                animationDelay: `${star.delay}s`,
              } as React.CSSProperties}
            />
          ))}
          {/* Ay */}
          <div className="moon" />
        </div>
      )}

      {/* Gündüz güneşi */}
      {message.theme === "day" && (
        <div className="sun" />
      )}

      {/* Ana İçerik */}
      <div className="relative z-10 text-center px-4">
        {/* İkon */}
        <div className="mb-6 animate-scale-in">
          {message.theme === "night" && (
            <span className="text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">🌙</span>
          )}
          {message.theme === "day" && (
            <span className="text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">☀️</span>
          )}
          {message.theme === "voting" && (
            <span className="text-7xl md:text-8xl drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">⚖️</span>
          )}
        </div>

        {/* Başlık */}
        <h1
          className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest mb-4 animate-rise-up"
          style={{
            textShadow: message.theme === "night"
              ? "0 0 30px rgba(99, 102, 241, 0.5)"
              : message.theme === "day"
                ? "0 0 30px rgba(251, 191, 36, 0.5)"
                : "0 0 30px rgba(239, 68, 68, 0.5)",
          }}
        >
          {message.title}
        </h1>

        {/* Alt Yazı */}
        <p
          className="text-lg md:text-xl text-white/70 font-medium animate-fade-in-slow"
        >
          {message.subtitle}
        </p>
      </div>

      {/* Alt Sis Efekti */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  )
}

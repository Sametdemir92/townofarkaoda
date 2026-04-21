"use client"

import { useEffect, useState, useRef } from "react"
import type { RoleName } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"

interface OlumAnimasyonuProps {
  username: string
  role: RoleName
  reason: string
  onComplete: () => void
}

export function OlumAnimasyonu({ username, role, reason, onComplete }: OlumAnimasyonuProps) {
  const [stage, setStage] = useState<"enter" | "reveal" | "exit">("enter")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const roleInfo = ROLE_DEFINITIONS[role]
  const isMafia = roleInfo.team === "mafia"
  const roleImage = `/roles/${role.toLowerCase()}.png`

  const isMafiaKill = reason === "mafia_kill" || reason.toLowerCase().includes("mafya")
  const isTownVote = reason === "town_vote" || reason.toLowerCase().includes("asıl") || reason.toLowerCase().includes("kasaba")

  useEffect(() => {
    const revealTimer = setTimeout(() => setStage("reveal"), 600)
    const exitTimer = setTimeout(() => setStage("exit"), 4500)
    const completeTimer = setTimeout(() => onCompleteRef.current(), 5500)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [])

  const reasonText = isMafiaKill
    ? "Mafya tarafından öldürüldü"
    : isTownVote
      ? "Kasaba tarafından asıldı"
      : reason

  return (
    <div className={`death-overlay ${stage === "exit" ? "animate-fade-out" : ""}`}>

      {/* ===================== MAFYA ÖLDÜRMESI ===================== */}
      {isMafiaKill && (
        <>
          {/* Kırmızı karanlık arka plan */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/80 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(127,29,29,0.4),transparent_60%)]" />

          {/* Kan damlaları */}
          <div className="absolute top-0 left-[8%] w-1.5 h-48 bg-gradient-to-b from-red-600/80 to-transparent rounded-full animate-blood-drip" style={{ animationDelay: "0.2s" }} />
          <div className="absolute top-0 left-[22%] w-1 h-32 bg-gradient-to-b from-red-700/60 to-transparent rounded-full animate-blood-drip" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-0 left-[55%] w-1 h-40 bg-gradient-to-b from-red-700/70 to-transparent rounded-full animate-blood-drip" style={{ animationDelay: "0.3s" }} />
          <div className="absolute top-0 left-[72%] w-1.5 h-36 bg-gradient-to-b from-red-600/60 to-transparent rounded-full animate-blood-drip" style={{ animationDelay: "0.7s" }} />
          <div className="absolute top-0 left-[88%] w-1 h-28 bg-gradient-to-b from-red-700/50 to-transparent rounded-full animate-blood-drip" style={{ animationDelay: "1s" }} />

          {/* Kırmızı pulse */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-red-600/10 animate-ping" style={{ animationDuration: "2.5s" }} />
          </div>

          {/* İçerik */}
          <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">

            {/* Karakter Portresi */}
            <div className={`relative mb-6 transition-all duration-700 ${stage === "enter" ? "scale-0 rotate-12 opacity-0" : "scale-100 rotate-0 opacity-100"}`}>
              {/* Dış glow çerçeve */}
              <div className="absolute -inset-3 rounded-full bg-red-600/30 blur-xl animate-pulse" />
              {/* Bıçak süsü */}
              <div className={`absolute -top-6 -right-6 z-20 transition-all duration-500 ${stage === "enter" ? "opacity-0 -translate-y-8 rotate-[-60deg]" : "opacity-100 translate-y-0 rotate-[20deg]"}`} style={{ transitionDelay: "400ms" }}>
                <span className="text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">🔪</span>
              </div>
              {/* Portre */}
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 ${isMafia ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]" : "border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)]"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={roleImage}
                  alt={roleInfo.displayName}
                  className="w-full h-full object-cover grayscale-[30%] brightness-90"
                />
              </div>
              {/* Kırmızı X işareti */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${stage === "reveal" || stage === "exit" ? "opacity-70" : "opacity-0"}`}>
                <span className="text-7xl md:text-8xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" style={{ textShadow: "0 0 30px rgba(239,68,68,0.8)" }}>✕</span>
              </div>
            </div>

            {/* İsim */}
            <div className={`transition-all duration-500 ${stage !== "enter" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: "300ms" }}>
              <h2
                className="text-3xl md:text-5xl font-black text-red-100 uppercase tracking-wider mb-1"
                style={{ textShadow: "0 0 30px rgba(239, 68, 68, 0.7), 0 2px 10px rgba(0,0,0,0.8)" }}
              >
                {username}
              </h2>
              <p className="text-red-400/80 text-sm uppercase tracking-[0.3em] font-bold mb-4">öldürüldü</p>
            </div>

            {/* Rol Badge */}
            {(stage === "reveal" || stage === "exit") && (
              <div className="animate-scale-in mt-2">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 backdrop-blur-sm ${
                  isMafia
                    ? "bg-red-950/80 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                    : "bg-blue-950/80 border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                }`}>
                  {/* Mini portre */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={roleImage} alt={roleInfo.displayName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg">{roleInfo.emoji}</span>
                  <span className={`text-xl font-bold ${isMafia ? "text-red-300" : "text-blue-300"}`}>
                    {roleInfo.displayName}
                  </span>
                </div>
              </div>
            )}

            {/* Sebep */}
            {(stage === "reveal" || stage === "exit") && (
              <p className="text-red-400/60 text-base mt-6 font-medium italic animate-fade-in-slow">
                &quot;{reasonText}&quot;
              </p>
            )}
          </div>

          {/* Alt kırmızı sis */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-red-900/40 to-transparent" />
        </>
      )}

      {/* ===================== KASABA ASILMASI ===================== */}
      {isTownVote && (
        <>
          {/* Koyu amber/kahverengi arka plan */}
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-amber-950/60 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(120,53,15,0.3),transparent_65%)]" />

          {/* Darağacı yapısı */}
          <div className="absolute top-[6%] left-1/2 -translate-x-1/2 z-20">
            {/* Dikey direk */}
            <div className={`w-4 h-[160px] bg-gradient-to-b from-amber-800 to-amber-900 rounded-sm mx-auto shadow-[2px_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ${stage === "enter" ? "opacity-0 scale-y-0" : "opacity-100 scale-y-100"}`} style={{ transformOrigin: "bottom" }} />
            {/* Yatay direk */}
            <div className={`absolute top-0 left-1/2 w-[100px] h-3 bg-gradient-to-r from-amber-900 to-amber-800 rounded-sm shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-700 ${stage === "enter" ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"}`} style={{ transitionDelay: "400ms", transformOrigin: "left" }} />
            {/* İp */}
            <div className={`absolute top-3 w-0.5 bg-amber-600/80 transition-all duration-500 ${stage === "enter" ? "h-0 opacity-0" : "h-14 opacity-100"}`} style={{ transitionDelay: "800ms", left: "calc(50% + 45px)" }} />
          </div>

          {/* Kalabalık silüetleri */}
          <div className="absolute bottom-[6%] left-0 right-0 flex justify-center gap-4 opacity-15 z-5">
            {["👤", "👤", "👤", "👤", "👤", "👤", "👤", "👤"].map((emoji, i) => (
              <span
                key={i}
                className="text-2xl md:text-3xl stagger-item"
                style={{ animationDelay: `${1200 + i * 80}ms`, filter: "brightness(0.3)" }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Meşale ışıkları */}
          <div className="absolute bottom-[12%] left-[12%] w-24 h-24 rounded-full bg-orange-500/8 blur-2xl animate-pulse-slow" />
          <div className="absolute bottom-[12%] right-[12%] w-24 h-24 rounded-full bg-orange-500/8 blur-2xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[20%] left-[20%] w-16 h-16 rounded-full bg-amber-500/5 blur-xl animate-pulse-slow" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-[20%] right-[20%] w-16 h-16 rounded-full bg-amber-500/5 blur-xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />

          {/* İçerik */}
          <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">

            {/* Karakter Portresi - idam edilen kişi */}
            <div className={`relative mb-6 transition-all duration-800 ${stage === "enter" ? "opacity-0 translate-y-[-40px]" : "opacity-100 translate-y-0"}`} style={{ transitionDelay: "600ms" }}>
              {/* Dış glow */}
              <div className="absolute -inset-3 rounded-full bg-amber-600/20 blur-xl animate-pulse-slow" />
              {/* İp bağlantısı (portre üstünde) */}
              <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-amber-600/60 transition-all duration-500 ${stage === "enter" ? "opacity-0" : "opacity-100"}`} style={{ transitionDelay: "900ms" }} />
              {/* Portre */}
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 ${isMafia ? "border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "border-amber-500/80 shadow-[0_0_30px_rgba(217,119,6,0.4)]"} ${(stage === "reveal" || stage === "exit") ? "animate-swing" : ""}`} style={{ transformOrigin: "top center", animationDuration: "3s" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={roleImage}
                  alt={roleInfo.displayName}
                  className="w-full h-full object-cover sepia-[20%] brightness-75"
                />
              </div>
              {/* Halat düğümü dekorasyonu */}
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 transition-all duration-500 ${stage === "enter" ? "opacity-0 scale-0" : "opacity-80 scale-100"}`} style={{ transitionDelay: "1000ms" }}>
                <span className="text-2xl">🪢</span>
              </div>
            </div>

            {/* İsim */}
            <div className={`transition-all duration-700 ${stage !== "enter" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`} style={{ transitionDelay: "700ms" }}>
              <p className="text-orange-400/50 text-xs uppercase tracking-[0.4em] font-bold mb-2">kasaba kararı</p>
              <h2
                className="text-3xl md:text-5xl font-black text-amber-100 uppercase tracking-wider mb-1"
                style={{ textShadow: "0 0 25px rgba(217, 119, 6, 0.5), 0 2px 10px rgba(0,0,0,0.8)" }}
              >
                {username}
              </h2>
              <p className="text-orange-400/70 text-sm uppercase tracking-[0.3em] font-bold mb-4">asıldı</p>
            </div>

            {/* Rol Badge */}
            {(stage === "reveal" || stage === "exit") && (
              <div className="animate-scale-in mt-2">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 backdrop-blur-sm ${
                  isMafia
                    ? "bg-red-950/80 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                    : "bg-blue-950/80 border-blue-500/60 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                }`}>
                  {/* Mini portre */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={roleImage} alt={roleInfo.displayName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg">{roleInfo.emoji}</span>
                  <span className={`text-xl font-bold ${isMafia ? "text-red-300" : "text-blue-300"}`}>
                    {roleInfo.displayName}
                  </span>
                </div>
              </div>
            )}

            {/* Sebep */}
            {(stage === "reveal" || stage === "exit") && (
              <p className="text-amber-500/50 text-base mt-6 font-medium italic animate-fade-in-slow">
                &quot;{reasonText}&quot;
              </p>
            )}
          </div>

          {/* Alt sis */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-950/50 to-transparent" />
        </>
      )}

      {/* ===================== DİĞER SEBEPLER ===================== */}
      {!isMafiaKill && !isTownVote && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(75,85,99,0.2),transparent_60%)]" />

          <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
            {/* Karakter Portresi */}
            <div className={`relative mb-6 transition-all duration-700 ${stage === "enter" ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}>
              <div className="absolute -inset-3 rounded-full bg-gray-500/20 blur-xl" />
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 ${isMafia ? "border-red-500/70" : "border-gray-500/70"} shadow-[0_0_30px_rgba(156,163,175,0.3)]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={roleImage}
                  alt={roleInfo.displayName}
                  className="w-full h-full object-cover grayscale brightness-75"
                />
              </div>
            </div>

            <div className={`transition-all duration-500 ${stage !== "enter" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <h2
                className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-3"
                style={{ textShadow: "0 0 20px rgba(156, 163, 175, 0.6)" }}
              >
                {username}
              </h2>
            </div>

            {(stage === "reveal" || stage === "exit") && (
              <div className="animate-scale-in mt-4">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${
                  isMafia
                    ? "bg-red-950/80 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                    : "bg-blue-950/80 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                }`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={roleImage} alt={roleInfo.displayName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg">{roleInfo.emoji}</span>
                  <span className={`text-xl font-bold ${isMafia ? "text-red-400" : "text-blue-400"}`}>
                    {roleInfo.displayName}
                  </span>
                </div>
              </div>
            )}

            {(stage === "reveal" || stage === "exit") && (
              <p className="text-gray-400 text-lg mt-6 animate-fade-in-slow font-medium italic">
                &quot;{reasonText}&quot;
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useRef } from "react"

interface OylamaAnimasyonuProps {
  targetUsername: string
  voteCount: number
  totalVoters: number
  onComplete: () => void
}

export function OylamaAnimasyonu({ targetUsername, voteCount, totalVoters, onComplete }: OylamaAnimasyonuProps) {
  const [displayCount, setDisplayCount] = useState(0)
  const [stage, setStage] = useState<"counting" | "result" | "exit">("counting")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    // Count-up animasyonu
    if (voteCount === 0) {
      setStage("result")
      const t1 = setTimeout(() => setStage("exit"), 2000)
      const t2 = setTimeout(() => onCompleteRef.current(), 2800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }

    let count = 0
    const interval = setInterval(() => {
      count++
      setDisplayCount(count)
      if (count >= voteCount) {
        clearInterval(interval)
        setTimeout(() => setStage("result"), 500)
        setTimeout(() => setStage("exit"), 2500)
        setTimeout(() => onCompleteRef.current(), 3300)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [voteCount])

  return (
    <div className={`fixed inset-0 z-[160] flex items-center justify-center bg-black/85 backdrop-blur-sm ${stage === "exit" ? "animate-fade-out" : "animate-fade-in"}`}>
      <div className="text-center">
        {/* Başlık */}
        <h2 className="text-2xl md:text-3xl font-bold text-orange-400 uppercase tracking-wider mb-8 animate-slide-up">
          Oylama Sonucu
        </h2>

        {/* Hedef İsim */}
        <div className="mb-8">
          <div className={`inline-block px-8 py-4 rounded-xl border-2 transition-all duration-500 ${
            stage === "result"
              ? "border-red-500 bg-red-950/50 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-shake"
              : "border-orange-500/50 bg-orange-950/30"
          }`}>
            <p className="text-3xl md:text-5xl font-black text-white">
              {targetUsername}
            </p>
          </div>
        </div>

        {/* Oy Sayacı */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-6xl md:text-8xl font-black text-orange-400 vote-count-animate" key={displayCount}>
            {displayCount}
          </span>
          <span className="text-2xl md:text-3xl text-gray-500 font-medium">
            / {totalVoters}
          </span>
        </div>

        {/* Oy kutuları animasyonu */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalVoters }).map((_, i) => (
            <div
              key={i}
              className={`w-6 h-8 rounded transition-all duration-300 ${
                i < displayCount
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] scale-110"
                  : "bg-gray-700 border border-gray-600"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {i < displayCount && (
                <span className="text-xs text-white flex items-center justify-center h-full">🗳️</span>
              )}
            </div>
          ))}
        </div>

        {/* Sonuç Yazısı */}
        {stage === "result" && (
          <p className="text-xl text-red-400 font-semibold animate-scale-in">
            {voteCount > totalVoters / 2
              ? `${targetUsername} elenecek!`
              : "Yeterli oy toplanamadı"}
          </p>
        )}
      </div>
    </div>
  )
}

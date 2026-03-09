"use client"

import { useEffect, useState } from "react"
import type { RoleName } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"

interface RoleRevealProps {
  myRole: RoleName | null
}

const ALL_ROLES = Object.keys(ROLE_DEFINITIONS) as RoleName[]

export function RoleRevealAnimasyonu({ myRole }: RoleRevealProps) {
  const [displayedRole, setDisplayedRole] = useState<string>("?")
  const [isSpinning, setIsSpinning] = useState(true)

  useEffect(() => {
    if (!myRole) return

    let intervalId: NodeJS.Timeout
    let currentSpinCount = 0
    const maxSpins = 30 // Kaç kere dönecek
    const spinDelay = 100 // Her dönüş hızı (100ms * 30 = 3 saniye)

    // Hızlı dönüş animasyonu
    intervalId = setInterval(() => {
      currentSpinCount++
      const randomRole = ALL_ROLES[Math.floor(Math.random() * ALL_ROLES.length)]
      setDisplayedRole(ROLE_DEFINITIONS[randomRole].displayName)

      // Dönme bittiğinde asıl rolü göster
      if (currentSpinCount >= maxSpins) {
        clearInterval(intervalId)
        setIsSpinning(false)
        setDisplayedRole(ROLE_DEFINITIONS[myRole].displayName)
      }
    }, spinDelay)

    return () => clearInterval(intervalId)
  }, [myRole])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="text-center w-full max-w-2xl px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 uppercase tracking-widest opacity-90">
          {isSpinning ? "Senin Rolün Nedir?" : "Rolün Belli Oldu"}
        </h2>

        <div className={`
          relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full border-[6px] flex flex-col items-center justify-center
          transition-all duration-700 ease-in-out
          ${isSpinning ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.7)] animate-pulse' : 
            myRole && ROLE_DEFINITIONS[myRole].team === "mafia" ? 'border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.9)] bg-gradient-to-br from-red-900/50 to-black' : 'border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.9)] bg-gradient-to-br from-blue-900/50 to-black'}
        `}>
          {isSpinning ? (
            <div className="text-3xl md:text-5xl font-black text-gray-200 tracking-wider">
              {displayedRole}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center translate-y-[-10px] animate-[bounce_1s_ease-in-out_infinite]">
              <span className="text-7xl md:text-8xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                {myRole ? ROLE_DEFINITIONS[myRole].emoji : "❓"}
              </span>
              <span className={`text-4xl md:text-5xl font-black uppercase tracking-wider ${myRole && ROLE_DEFINITIONS[myRole].team === "mafia" ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'}`}>
                {displayedRole}
              </span>
            </div>
          )}
        </div>

        {!isSpinning && myRole && (
          <div className="mt-12 max-w-lg mx-auto p-6 bg-white/10 rounded-2xl border border-white/20 shadow-2xl transition-all duration-1000 ease-in opacity-100 translate-y-0">
            <p className="text-gray-200 text-xl font-medium leading-relaxed">
              {ROLE_DEFINITIONS[myRole].description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


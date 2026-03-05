"use client"

import type { GamePhase } from "@/types/game"
import { Moon, Sun, Vote, Trophy } from "lucide-react"

interface FazGostergesiProps {
  phase: GamePhase
  dayCount: number
}

const phaseConfig: Record<
  GamePhase,
  { label: string; icon: React.ComponentType<any>; color: string; bg: string }
> = {
  lobby: {
    label: "Bekleme Odasi",
    icon: Sun,
    color: "text-gray-400",
    bg: "bg-gray-800",
  },
  night: {
    label: "Gece",
    icon: Moon,
    color: "text-indigo-400",
    bg: "bg-indigo-900/30",
  },
  day_discussion: {
    label: "Gunduz - Tartisma",
    icon: Sun,
    color: "text-yellow-400",
    bg: "bg-yellow-900/20",
  },
  day_voting: {
    label: "Gunduz - Oylama",
    icon: Vote,
    color: "text-orange-400",
    bg: "bg-orange-900/20",
  },
  ended: {
    label: "Oyun Bitti",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-900/20",
  },
}

export function FazGostergesi({ phase, dayCount }: FazGostergesiProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg ${config.bg} transition-all duration-500`}
    >
      <Icon className={`h-5 w-5 ${config.color}`} />
      <div>
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
        {dayCount > 0 && phase !== "ended" && (
          <span className="text-gray-500 text-sm ml-2">
            Gun {dayCount}
          </span>
        )}
      </div>
    </div>
  )
}

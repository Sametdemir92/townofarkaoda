"use client"

import { formatTime } from "@/lib/utils"
import { Clock } from "lucide-react"

interface TimerProps {
  seconds: number
  phase: string
}

export function Timer({ seconds, phase }: TimerProps) {
  const isCritical = seconds <= 10
  const percentage = (() => {
    const maxTime =
      phase === "night" ? 30 : phase === "day_discussion" ? 60 : 30
    return Math.max(0, (seconds / maxTime) * 100)
  })()

  return (
    <div className="flex items-center gap-3">
      <Clock className={`h-5 w-5 ${isCritical ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
      <div className="flex-1">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isCritical
                ? "bg-red-500"
                : percentage > 50
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span
        className={`font-mono text-lg font-bold min-w-[50px] text-right ${
          isCritical ? "text-red-500 timer-critical" : "text-white"
        }`}
      >
        {formatTime(seconds)}
      </span>
    </div>
  )
}

"use client"

import type { GameLogEntry } from "@/types/game"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Moon, Sun, Skull, Heart, Info, Vote, Trophy } from "lucide-react"

interface OyunLogProps {
  logs: GameLogEntry[]
}

const actionIcons: Record<string, React.ComponentType<any>> = {
  phase: Sun,
  system: Info,
  elimination: Skull,
  heal: Heart,
  vote: Vote,
  info: Info,
  end: Trophy,
}

const actionColors: Record<string, string> = {
  phase: "text-yellow-400",
  system: "text-gray-400",
  elimination: "text-red-400",
  heal: "text-green-400",
  vote: "text-orange-400",
  info: "text-blue-400",
  end: "text-yellow-400",
}

export function OyunLog({ logs }: OyunLogProps) {
  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <BookOpen className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Oyun Kaydi</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-4">
            Henuz kayit yok
          </div>
        ) : (
          logs.map((log) => {
            const Icon = actionIcons[log.action] || Info
            const color = actionColors[log.action] || "text-gray-400"

            return (
              <div key={log.id} className="flex items-start gap-2 text-sm message-enter">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
                <span className="text-gray-300">{log.detail}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

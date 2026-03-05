"use client"

import type { Player, RoleName } from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Moon, Target, CheckCircle } from "lucide-react"

interface GeceAksiyonProps {
  myRole: RoleName
  players: Player[]
  myPlayerId: string
  selectedTarget: string | null
  onSelectTarget: (playerId: string) => void
  onConfirm: () => void
  nightResult: string | null
  hasSubmitted: boolean
}

export function GeceAksiyon({
  myRole,
  players,
  myPlayerId,
  selectedTarget,
  onSelectTarget,
  onConfirm,
  nightResult,
  hasSubmitted,
}: GeceAksiyonProps) {
  const roleInfo = ROLE_DEFINITIONS[myRole]
  const isVatandas = myRole === "VATANDAS"
  const alivePlayers = players.filter((p) => p.isAlive && p.id !== myPlayerId)

  // Mafya kendi takim arkadasini hedef alamaz
  const validTargets = alivePlayers.filter((p) => {
    if (myRole === "MAFYA" && p.role === "MAFYA") return false
    if (myRole === "DEDEKTIF") return true
    return true
  })

  // Doktor kendini de koruyabilir
  const allTargets = myRole === "DOKTOR"
    ? players.filter((p) => p.isAlive)
    : validTargets

  return (
    <Card className="bg-indigo-900/20 border-indigo-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-300">
          <Moon className="h-5 w-5" />
          Gece Aksiyonu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rol Bilgisi */}
        <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
          <span className="text-2xl">{roleInfo.emoji}</span>
          <div>
            <div className="font-semibold text-white">{roleInfo.displayName}</div>
            <div className="text-sm text-gray-400">{roleInfo.nightAbility || "Ozel yetenegin yok"}</div>
          </div>
        </div>

        {/* Gece Sonucu (Dedektif) */}
        {nightResult && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm">
            {nightResult}
          </div>
        )}

        {/* Vatandas */}
        {isVatandas && (
          <div className="text-center text-gray-500 py-4">
            Gece yapabilcegin bir aksiyon yok. Sabahi bekle...
          </div>
        )}

        {/* Aksiyonu olan roller */}
        {!isVatandas && !hasSubmitted && (
          <div className="space-y-2">
            <div className="text-sm text-gray-400 mb-2">
              {myRole === "MAFYA" && "Kimi oldureceginizi secin:"}
              {myRole === "DOKTOR" && "Kimi korumak istersin:"}
              {myRole === "DEDEKTIF" && "Kimi sorusturmak istersin:"}
            </div>
            {allTargets.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectTarget(player.id)}
                className={`w-full flex items-center justify-between rounded-lg p-3 transition-all ${
                  selectedTarget === player.id
                    ? "bg-indigo-600/30 ring-2 ring-indigo-500"
                    : "bg-gray-700/30 hover:bg-gray-700/50"
                }`}
              >
                <span className="text-white">{player.username}</span>
                {selectedTarget === player.id && (
                  <Target className="h-4 w-4 text-indigo-400" />
                )}
              </button>
            ))}

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
              onClick={onConfirm}
              disabled={!selectedTarget}
            >
              <Target className="h-4 w-4 mr-2" />
              Onayla
            </Button>
          </div>
        )}

        {/* Gonderildikten sonra */}
        {hasSubmitted && !isVatandas && (
          <div className="flex items-center gap-2 text-green-400 justify-center py-4">
            <CheckCircle className="h-5 w-5" />
            <span>Aksiyonun gonderildi. Sabahi bekliyorsun...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

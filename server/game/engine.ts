// ============================================
// Town of Arkaoda - Oyun Motoru (State Machine)
// ============================================

import type {
  GameState,
  GamePhase,
  Player,
  Vote,
  NightAction,
  GameLogEntry,
  RoleName,
  WinnerTeam,
  PHASE_DURATIONS,
} from "@/types/game"
import { ROLE_DEFINITIONS } from "@/types/game"
import { assignRoles } from "./roles"
import { resolveNightActions, NightResolution } from "./phases/night-phase"
import { resolveVotes, VoteResolution } from "./phases/day-phase"
import { checkWinCondition } from "./win-conditions"
import { nanoid } from "nanoid"

// ---- Aktif Oyunlar ----

const activeGames = new Map<string, GameEngine>()

export function getGameEngine(roomId: string): GameEngine | undefined {
  return activeGames.get(roomId)
}

export function createGameEngine(roomId: string, roomCode: string, hostId: string, players: Player[]): GameEngine {
  const engine = new GameEngine(roomId, roomCode, hostId, players)
  activeGames.set(roomId, engine)
  return engine
}

export function removeGameEngine(roomId: string): void {
  const engine = activeGames.get(roomId)
  if (engine) {
    engine.cleanup()
    activeGames.delete(roomId)
  }
}

// ---- Timer Sureleri ----

const DURATIONS = {
  night: 30,
  day_discussion: 60,
  day_voting: 30,
}

// ---- Game Engine ----

export class GameEngine {
  private state: GameState
  private timerInterval: NodeJS.Timeout | null = null
  private onStateChange: ((state: GameState) => void) | null = null
  private onPhaseChange: ((phase: GamePhase, dayCount: number, timer: number) => void) | null = null
  private onPlayerEliminated: ((playerId: string, username: string, role: RoleName, reason: string) => void) | null = null
  private onNightResult: ((playerId: string, message: string) => void) | null = null
  private onGameEnd: ((winner: WinnerTeam, players: Player[]) => void) | null = null
  private onTimerTick: ((seconds: number) => void) | null = null
  private onGameLog: ((entry: GameLogEntry) => void) | null = null

  constructor(roomId: string, roomCode: string, hostId: string, players: Player[]) {
    this.state = {
      roomId,
      roomCode,
      phase: "lobby",
      players: players.map((p) => ({ ...p, role: null, isAlive: true, isBot: p.isBot ?? false })),
      votes: [],
      nightActions: [],
      dayCount: 0,
      hostId,
      timer: 0,
      winner: null,
      gameLog: [],
      eliminatedTonight: null,
      eliminatedToday: null,
      jailedPlayerId: null,
    }
  }

  // ---- Event Handlers ----

  onEvent(event: string, handler: (...args: any[]) => void): void {
    switch (event) {
      case "stateChange":
        this.onStateChange = handler
        break
      case "phaseChange":
        this.onPhaseChange = handler
        break
      case "playerEliminated":
        this.onPlayerEliminated = handler
        break
      case "nightResult":
        this.onNightResult = handler
        break
      case "gameEnd":
        this.onGameEnd = handler
        break
      case "timerTick":
        this.onTimerTick = handler
        break
      case "gameLog":
        this.onGameLog = handler
        break
    }
  }

  // ---- Getters ----

  getState(): GameState {
    return { ...this.state }
  }

  getPlayerRole(playerId: string): RoleName | null {
    const player = this.state.players.find((p) => p.id === playerId)
    return player?.role || null
  }

  getAlivePlayers(): Player[] {
    return this.state.players.filter((p) => p.isAlive)
  }

  getMafiaPlayers(): Player[] {
    return this.state.players.filter((p) => (p.role === "MAFYA" || p.role === "AJAN") && p.isAlive)
  }

  isPlayerAlive(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId)
    return player?.isAlive ?? false
  }

  // Gardiyan'in gunduz secimi
  setJailedPlayer(targetId: string): boolean {
    if (this.state.phase !== "day_discussion") return false
    const target = this.state.players.find((p) => p.id === targetId && p.isAlive)
    if (!target) return false
    this.state.jailedPlayerId = targetId
    return true
  }

  // ---- Oyunu Baslat ----

  startGame(): boolean {
    if (this.state.phase !== "lobby") return false
    if (this.state.players.length < 3) return false // Bot dahil minimum 3

    // Rolleri ata
    this.state.players = assignRoles(this.state.players)
    this.state.dayCount = 1

    this.addLog("Oyun basladi! Roller atandi.", "system")

    // Gece fazina gec
    this.transitionTo("night")

    return true
  }

  // ---- Faz Gecisleri ----

  private transitionTo(phase: GamePhase): void {
    this.stopTimer()

    this.state.phase = phase
    this.state.votes = []
    this.state.nightActions = []
    this.state.eliminatedTonight = null
    this.state.eliminatedToday = null

    switch (phase) {
      case "night":
        this.state.timer = DURATIONS.night
        this.addLog(`Gece ${this.state.dayCount} basladi. Kasaba uyuyor...`, "phase")
        break

      case "day_discussion":
        this.state.timer = DURATIONS.day_discussion
        this.addLog(`Gun ${this.state.dayCount} basladi. Tartisma zamani!`, "phase")
        break

      case "day_voting":
        this.state.timer = DURATIONS.day_voting
        this.addLog(`Oylama basladi! Kimi elemek istiyorsunuz?`, "phase")
        break

      case "ended":
        this.state.timer = 0
        break
    }

    // Phase change event'i
    this.onPhaseChange?.(phase, this.state.dayCount, this.state.timer)
    this.emitStateChange()

    // Timer baslat
    if (phase !== "ended" && phase !== "lobby") {
      this.startTimer()
    }
  }

  // ---- Timer ----

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.state.timer -= 1
      this.onTimerTick?.(this.state.timer)

      if (this.state.timer <= 0) {
        this.onTimerExpired()
      }
    }, 1000)
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  private onTimerExpired(): void {
    this.stopTimer()

    switch (this.state.phase) {
      case "night":
        this.resolveNight()
        break

      case "day_discussion":
        this.transitionTo("day_voting")
        break

      case "day_voting":
        this.resolveVoting()
        break
    }
  }

  // ---- Gece Aksiyonlari ----

  submitNightAction(playerId: string, targetId: string): boolean {
    if (this.state.phase !== "night") return false

    const player = this.state.players.find((p) => p.id === playerId)
    if (!player || !player.isAlive || !player.role) return false

    // Vatandas aksiyon yapamaz
    if (player.role === "VATANDAS") return false

    // Zaten aksiyon yapmis mi?
    const existing = this.state.nightActions.findIndex((a) => a.playerId === playerId)
    if (existing >= 0) {
      this.state.nightActions[existing] = { playerId, role: player.role, targetId }
    } else {
      this.state.nightActions.push({ playerId, role: player.role, targetId })
    }

    // Tum aksiyonlar geldi mi kontrol et
    if (this.allNightActionsReceived()) {
      this.resolveNight()
    }

    return true
  }

  private allNightActionsReceived(): boolean {
    const actionPlayers = this.getAlivePlayers().filter((p) => p.role !== "VATANDAS" && p.role !== "MEDYUM" && p.role !== "BASKAN" && p.role !== "GARDIYAN")
    return actionPlayers.every((p) =>
      this.state.nightActions.some((a) => a.playerId === p.id)
    )
  }

  private resolveNight(): void {
    this.stopTimer()

    const resolution = resolveNightActions(this.state.nightActions, this.state.players, this.state.jailedPlayerId)

    // Hapislenen oyuncuya bilgi ver
    if (this.state.jailedPlayerId) {
      const jailed = this.state.players.find((p) => p.id === this.state.jailedPlayerId)
      if (jailed) {
        this.addLog(`${jailed.username} bu gece gardiyan tarafından hapse atıldı ve hiçbir aksiyon yapamadı.`, "info")
      }
      this.state.jailedPlayerId = null // Sifirla
    }

    // Oldurulen oyuncu
    if (resolution.killedPlayerId) {
      const killed = this.state.players.find((p) => p.id === resolution.killedPlayerId)
      if (killed) {
        killed.isAlive = false
        this.state.eliminatedTonight = killed.id

        // Rastgele olum hikayesi varyasyonlari
        const deathStories = [
          `Gece karanlığında kasabada bir çığlık koptu! Sabah olduğunda ${killed.username} evinde ölü bulundu. Mafya işini acımasızca halletmişti. (Rolü: ${killed.role})`,
          `Gece sessizdi ama sabahın ilk ışıklarıyla acı gerçek ortaya çıktı. ${killed.username} mafyanın kurbanı olmuştu. (Rolü: ${killed.role})`,
          `Kan donduran bir geceydi. Kasabalılar uyandıklarında ${killed.username} isimli sakinin cansız bedeniyle karşılaştı. (Rolü: ${killed.role})`,
          `Kötü niyetli gölgeler gece boyunca avlandı. Maalesef hedef tahtasında ${killed.username} vardı ve sabaha çıkamadı. (Rolü: ${killed.role})`,
          `Kasabanın köpekleri gece boyu uludu. Sabahın ilk ışıklarıyla birlikte ${killed.username}'in mafya tarafından infaz edildiği öğrenildi. (Rolü: ${killed.role})`,
          `Sokaklarda fısıltılar dolaşıyordu... Fısıltılar acı bir gerçeğe dönüştü: ${killed.username} bu kanlı geceyi atlatamadı! (Rolü: ${killed.role})`,
          `Bir silah sesi gecenin sessizliğini bıçak gibi kesti. Güneş doğduğunda ${killed.username}'in bedeni kanlar içindeydi. (Rolü: ${killed.role})`
        ]

        const storyIndex = Math.floor(Math.random() * deathStories.length)
        const storyMessage = deathStories[storyIndex]

        this.addLog(storyMessage, "elimination")
        this.onPlayerEliminated?.(killed.id, killed.username, killed.role!, "Mafya tarafından öldürüldü")
      }
    } else {
      // Kimse olmedi
      if (resolution.healedPlayerId) {
        // Rastgele kurtarma hikayesi varyasyonlari
        const healStories = [
          "Gece karanlığında birileri sinsi planlar peşindeydi, ancak Doktor tam zamanında oradaydı! Sabah kimsenin burnu bile kanamadan uyandık.",
          "Kasabanın sokaklarında karanlık bir gölge belirdi ama tetikte olan Doktor felaketi önledi. Ölüm bu gece kasabamızı es geçti!",
          "Mafya tetikçileri pusu kurmuştu ama hesaba katmadıkları biri vardı: Doktor herkesin hayatını korumayı başardı!",
          "Ölüm meleği kasabaya uğradı ama kahraman bir müdahale onu geri püskürttü! Kusursuz ve kayıpsız bir gece geride kaldı.",
          "Eczane dolabından çıkan birkaç sargı bezi ve doğru bir müdahale kasabada bir hayat kurtardı. Kimse zarar görmedi!"
        ]

        const storyMessage = healStories[Math.floor(Math.random() * healStories.length)]
        this.addLog(storyMessage, "heal")
      } else {
        // Rastgele olaysiz gece varyasyonlari
        const peacefulStories = [
          "Rüzgarın uğultusu dışında gece yavaş ve sessiz geçti. Sabah olunca herkes yatağından güvenle kalktı.",
          "Şaşırtıcı derecede huzurlu bir geceydi. Görünüşe göre mafya da biraz uykuya ihtiyaç duymuş. Kimse ölmedi!",
          "Sokak köpeklerinin bile sesi çıkmadı. Sessiz ve olaysız bir geceyi geride bıraktık.",
          "Gece kalın bir sis bulutu kasabanın üzerine çöktü ama altında hiç kan dökülmedi. Herkes sağ salim.",
          "Baykuşların ötüşü eşliğinde herkes mışıl mışıl uyudu. Kötüler bu gece grevdeydi anlaşılan!"
        ]

        const storyMessage = peacefulStories[Math.floor(Math.random() * peacefulStories.length)]
        this.addLog(storyMessage, "info")
      }
    }

    // Sorusturma sonuclari - Dedektif ve Ajan
    resolution.investigations.forEach((result, playerId) => {
      const action = this.state.nightActions.find((a) => a.playerId === playerId)
      const target = this.state.players.find((p) => p.id === action?.targetId)
      const investigator = this.state.players.find((p) => p.id === playerId)

      if (target && investigator) {
        let message = ""

        if (investigator.role === "AJAN") {
          // Ajan hedefin tam rolunu ogrenir
          const roleDef = ROLE_DEFINITIONS[target.role as RoleName]
          message = `${target.username} adlı kişinin rolü: ${roleDef?.displayName || target.role}${roleDef?.team === "mafia" ? " (Bizden biri!)" : " (Kasabalı)"}`
        } else {
          // Dedektif: supheli/masum
          message = result === "supheli"
            ? `${target.username} supheli gorunuyor! (Mafya)`
            : `${target.username} masum gorunuyor.`

          // Eger hedeflenen kisi o gece olmusse, dedektif cinayet anina sahit olur
          if (resolution.killedPlayerId === target.id) {
            const mafias = this.state.players
              .filter((p) => p.role === "MAFYA" || p.role === "AJAN")
              .map((p) => p.username)
              .join(", ")

            if (resolution.additionalKills.includes(playerId)) {
              message = `${target.username}'in öldürülme anına denk geldin! Mafya seni de fark etti: ${mafias}. Son nefesinle bu bilgiyi yanına aldın...`
            } else {
              message = `${target.username} bu gece gözlerinin önünde öldürüldü! Cinayete şahit oldun ve Mafya'yı gördün: ${mafias}`
            }
          }
        }

        this.onNightResult?.(playerId, message)
      }
    })

    // Ek olumler (Dedektif sucustu yakalandiysa)
    for (const additionalKillId of resolution.additionalKills) {
      const additionalKilled = this.state.players.find((p) => p.id === additionalKillId)
      if (additionalKilled && additionalKilled.isAlive) {
        additionalKilled.isAlive = false

        const detectiveDeathStories = [
          `Gece daha da karanlık bir hal aldı! ${additionalKilled.username} olay yerine gittiğinde mafya tarafından suçüstü yakalandı ve o da öldürüldü! (Rolü: ${additionalKilled.role})`,
          `Çifte felaket! ${additionalKilled.username} cinayeti araştırırken mafyanın eline düştü. Kasaba bu gece iki kayıp birden verdi! (Rolü: ${additionalKilled.role})`,
          `Mafya bu gece acımasızdı! ${additionalKilled.username} olay yerine vardığında karanlıkta gizlenen tetikçiler onu da hedefe aldı. (Rolü: ${additionalKilled.role})`,
        ]

        const storyMessage = detectiveDeathStories[Math.floor(Math.random() * detectiveDeathStories.length)]
        this.addLog(storyMessage, "elimination")
        this.onPlayerEliminated?.(additionalKilled.id, additionalKilled.username, additionalKilled.role!, "Olay yerinde mafya tarafından öldürüldü")
      }
    }

    // Win condition kontrolu
    const winner = checkWinCondition(this.state.players)
    if (winner) {
      this.endGame(winner)
      return
    }

    // Gunduz tartismaya gec
    this.transitionTo("day_discussion")
  }

  // ---- Oylama ----

  submitVote(voterId: string, targetId: string | null): boolean {
    if (this.state.phase !== "day_voting") return false

    const voter = this.state.players.find((p) => p.id === voterId)
    if (!voter || !voter.isAlive) return false

    // Kendi kendine oy veremez
    if (targetId && targetId === voterId) return false

    // Hedef hayatta mi?
    if (targetId) {
      const target = this.state.players.find((p) => p.id === targetId)
      if (!target || !target.isAlive) return false
    }

    // Mevcut oyu guncelle veya ekle
    const existing = this.state.votes.findIndex((v) => v.voterId === voterId)
    if (existing >= 0) {
      this.state.votes[existing] = { voterId, targetId }
    } else {
      this.state.votes.push({ voterId, targetId })
    }

    this.emitStateChange()

    // Tum oylar geldi mi?
    const aliveCount = this.getAlivePlayers().length
    if (this.state.votes.length >= aliveCount) {
      this.resolveVoting()
    }

    return true
  }

  private resolveVoting(): void {
    this.stopTimer()

    const resolution = resolveVotes(this.state.votes, this.state.players)

    if (resolution.eliminatedPlayerId) {
      const eliminated = this.state.players.find((p) => p.id === resolution.eliminatedPlayerId)
      if (eliminated) {
        eliminated.isAlive = false
        this.state.eliminatedToday = eliminated.id
        this.addLog(
          `${eliminated.username} oylamayla elendi! Rolu: ${eliminated.role}`,
          "elimination"
        )
        this.onPlayerEliminated?.(eliminated.id, eliminated.username, eliminated.role!, "Oylama ile elendi")
      }
    } else if (resolution.isTie) {
      this.addLog("Oylar esit! Kimse elenmedi.", "vote")
    } else {
      this.addLog("Yeterli oy kullanilamadi. Kimse elenmedi.", "vote")
    }

    // Win condition kontrolu
    const winner = checkWinCondition(this.state.players)
    if (winner) {
      this.endGame(winner)
      return
    }

    // Yeni geceye gec
    this.state.dayCount += 1
    this.transitionTo("night")
  }

  // ---- Oyun Sonu ----

  private endGame(winner: WinnerTeam): void {
    this.state.winner = winner

    const winnerText = winner === "town" ? "Kasaba" : winner === "mafia" ? "Mafya" : "Berabere"
    this.addLog(`Oyun bitti! ${winnerText} kazandi!`, "end")

    this.onGameEnd?.(winner, this.state.players)
    this.transitionTo("ended")
  }

  // ---- Oyuncu Baglanti Durumu ----

  setPlayerConnected(playerId: string, connected: boolean): void {
    const player = this.state.players.find((p) => p.id === playerId)
    if (player) {
      player.isConnected = connected
      this.emitStateChange()
    }
  }

  // ---- Yardimci ----

  private addLog(detail: string, action: string): void {
    const entry: GameLogEntry = {
      id: nanoid(),
      dayCount: this.state.dayCount,
      phase: this.state.phase,
      action,
      detail,
      timestamp: Date.now(),
    }
    this.state.gameLog.push(entry)
    this.onGameLog?.(entry)
  }

  private emitStateChange(): void {
    this.onStateChange?.(this.getState())
  }

  cleanup(): void {
    this.stopTimer()
  }
}

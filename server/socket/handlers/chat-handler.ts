// ============================================
// Socket - Chat Event Handler'lari
// ============================================

import type { Server, Socket } from "socket.io"
import type { SocketData, ClientToServerEvents, ServerToClientEvents } from "@/types/socket"
import type { ChatMessage, ChatChannel } from "@/types/game"
import { getGameEngine } from "@/server/game/engine"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { generateBotMessage, getBotChatDelay } from "@/server/game/bot-ai"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  const socketData = socket.data as SocketData

  socket.on("chat:send", async ({ message, channel }) => {
    try {
      if (!socketData.roomId || !socketData.playerId) {
        socket.emit("error", { message: "Odada degilsiniz" })
        return
      }

      // Mesaj validasyonu
      const trimmed = message.trim()
      if (!trimmed || trimmed.length > 500) {
        socket.emit("error", { message: "Gecersiz mesaj" })
        return
      }

      const engine = getGameEngine(socketData.roomId)

      // Faz ve yetki kontrolü
      if (engine) {
        const state = engine.getState()
        
        // Oyun bitmişse hiçbir rol/yaşam kısıtlaması uygulama
        if (state.phase !== "ended") {
          const isAlive = engine.isPlayerAlive(socketData.playerId)
          const playerRole = engine.getPlayerRole(socketData.playerId)

          if (!isAlive) {
            if (channel !== "DEAD") {
              socket.emit("error", { message: "Ölü oyuncular sadece Ölüler kanalında konuşabilir" })
              return
            }
          } else {
            // Yaşayan oyuncu
            if (channel === "DEAD") {
              if (playerRole !== "MEDYUM") {
                socket.emit("error", { message: "Sadece Medyum ölülerle konuşabilir" })
                return
              }
            }

            // Faz kontrolleri
            if (state.phase === "night") {
              // Gece sadece mafya kendi aralarinda konusabilir (veya Medyum ölülerle konuşabilir)
              if (channel !== "MAFIA" && channel !== "DEAD") {
                socket.emit("error", { message: "Gece sadece mafya chati veya ölüler chati kullanilabilir" })
                return
              }

              if (channel === "MAFIA" && playerRole !== "MAFYA" && playerRole !== "AJAN") {
                socket.emit("error", { message: "Sadece mafya uyeleri mafya chatini kullanabilir" })
                return
              }
            }

            if (state.phase === "day_discussion" || state.phase === "day_voting") {
              // Gunduz herkes PUBLIC kanalda konusabilir (Veya Medyum ölülerle)
              if (channel === "MAFIA") {
                socket.emit("error", { message: "Gunduz mafya chati kullanilamaz" })
                return
              }
            }
          }
        }
      }

      // Mesaj olustur
      const chatMessage: ChatMessage = {
        id: nanoid(),
        playerId: socketData.playerId,
        username: socketData.username,
        content: trimmed,
        channel: channel as ChatChannel,
        timestamp: Date.now(),
      }

      // DB'ye kaydet
      await prisma.message.create({
        data: {
          content: trimmed,
          playerId: socketData.playerId,
          roomId: socketData.roomId,
          channel: channel as any,
        },
      })

      // Mesaji gonder
      const isGameEnded = engine ? engine.getState().phase === "ended" : false

      if (isGameEnded) {
        // Oyun bitmişse hangi kanal olursa olsun herkese gönder
        io.to(socketData.roomId).emit("chat:message", chatMessage)
      } else if (channel === "MAFIA") {
        // Sadece mafya uyelerine gonder
        if (engine) {
          const mafiaPlayers = engine.getMafiaPlayers()
          const sockets = await io.in(socketData.roomId).fetchSockets()

          for (const s of sockets) {
            const sd = s.data as SocketData
            if (sd.playerId && mafiaPlayers.some((p) => p.id === sd.playerId)) {
              s.emit("chat:message", chatMessage)
            }
          }
        }
      } else if (channel === "DEAD") {
        // Sadece olu oyunculara VEYA Medyum olanlara gonder
        if (engine) {
          const state = engine.getState()
          const deadOrMedyumPlayers = state.players.filter(p => !p.isAlive || p.role === "MEDYUM")
          const sockets = await io.in(socketData.roomId).fetchSockets()

          for (const s of sockets) {
            const sd = s.data as SocketData
            if (sd.playerId && deadOrMedyumPlayers.some((p) => p.id === sd.playerId)) {
              s.emit("chat:message", chatMessage)
            }
          }
        }
      } else {
        // Herkese gonder
        io.to(socketData.roomId).emit("chat:message", chatMessage)

        // Bot yanit mekanizmasi (Sadece PUBLIC chat)
        // Botlar yalnızca isimleri geçtiğinde veya doğrudan hitap edildiğinde cevap verir
        if (engine) {
          const state = engine.getState();
          // Sadece gunduz fazlarinda botlar cevap verebilir
          if (state.phase.startsWith("day_")) {
            const aliveBots = state.players.filter(p => p.isAlive && p.isBot);
            if (aliveBots.length > 0) {
              const lowerMessage = trimmed.toLowerCase();
              // Mesajda adı geçen botları bul (Bot) ekini çıkararak karşılaştır
              const mentionedBots = aliveBots.filter(b => {
                const cleanName = b.username.replace(/\s*\(Bot\)\s*/i, "").toLowerCase();
                return lowerMessage.includes(cleanName);
              });

              // Sadece ismi geçen bot(lar) cevap verebilir
              if (mentionedBots.length > 0) {
                const targetBot = mentionedBots[Math.floor(Math.random() * mentionedBots.length)];
                const delay = getBotChatDelay();
                
                console.log(`[Bot Response] ${targetBot.username} ismi geçti, ${delay}ms sonra cevap verecek`);
                
                setTimeout(async () => {
                  const currentEngine = getGameEngine(socketData.roomId!);
                  if (!currentEngine) return;
                  const currentState = currentEngine.getState();
                  if (!currentState.phase.startsWith("day_")) return;
                  
                  const botStillAlive = currentState.players.find(p => p.id === targetBot.id && p.isAlive);
                  if (!botStillAlive) return;

                  try {
                    const replyContent = await generateBotMessage(
                      botStillAlive, 
                      currentState.players, 
                      "PUBLIC", 
                      "chat_reply",
                      trimmed,
                      socketData.username
                    );

                    if (replyContent) {
                      const botMsg: ChatMessage = {
                        id: nanoid(),
                        playerId: botStillAlive.id,
                        username: botStillAlive.username,
                        content: replyContent,
                        channel: "PUBLIC",
                        timestamp: Date.now(),
                      };
                      io.to(socketData.roomId!).emit("chat:message", botMsg);
                    }
                  } catch (error) {
                    console.error(`[Bot Response] Hata:`, error);
                  }
                }, delay);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("chat:send hatasi:", error)
      socket.emit("error", { message: "Mesaj gonderilirken hata olustu" })
    }
  })
}
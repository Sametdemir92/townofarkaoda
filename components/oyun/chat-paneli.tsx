"use client"

import { useState, useRef, useEffect } from "react"
import type { ChatMessage, ChatChannel, GamePhase, RoleName } from "@/types/game"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare } from "lucide-react"

interface ChatPaneliProps {
  messages: ChatMessage[]
  activeChannel: ChatChannel
  onSendMessage: (message: string, channel: ChatChannel) => void
  onChannelChange: (channel: ChatChannel) => void
  phase: GamePhase
  myRole: RoleName | null
  isAlive: boolean
}

export function ChatPaneli({
  messages,
  activeChannel,
  onSendMessage,
  onChannelChange,
  phase,
  myRole,
  isAlive,
}: ChatPaneliProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Yeni mesajda otomatik scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendMessage(inputValue.trim(), activeChannel)
    setInputValue("")
  }

  const canChat = isAlive && phase !== "lobby" && phase !== "ended"
  const canUseMafiaChat = myRole === "MAFYA" && phase === "night"
  const showMafiaTab = myRole === "MAFYA"

  // Filtrelenmis mesajlar
  const filteredMessages = messages.filter((m) => {
    if (activeChannel === "SYSTEM") return m.channel === "SYSTEM"
    return m.channel === activeChannel
  })

  return (
    <div className="flex flex-col h-full bg-gray-800/30 rounded-lg border border-gray-700">
      {/* Chat Baslik + Tab'lar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-700">
        <MessageSquare className="h-4 w-4 text-gray-400 ml-1" />
        <button
          onClick={() => onChannelChange("PUBLIC")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeChannel === "PUBLIC"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Genel
        </button>
        {showMafiaTab && (
          <button
            onClick={() => onChannelChange("MAFIA")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeChannel === "MAFIA"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Mafya
          </button>
        )}
        <button
          onClick={() => onChannelChange("SYSTEM")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeChannel === "SYSTEM"
              ? "bg-gray-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Sistem
        </button>
      </div>

      {/* Mesajlar */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[400px]">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8">
            Henuz mesaj yok
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div key={msg.id} className="message-enter">
              {msg.channel === "SYSTEM" ? (
                <div className="text-center text-xs text-gray-500 py-1">
                  {msg.content}
                </div>
              ) : (
                <div className="flex gap-2">
                  <span
                    className={`font-semibold text-sm shrink-0 ${
                      msg.channel === "MAFIA" ? "text-red-400" : "text-blue-400"
                    }`}
                  >
                    {msg.username}:
                  </span>
                  <span className="text-gray-300 text-sm break-words">
                    {msg.content}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mesaj Girisi */}
      <div className="p-2 border-t border-gray-700">
        {canChat ? (
          <div className="flex gap-2">
            <Input
              placeholder={
                phase === "night" && myRole !== "MAFYA"
                  ? "Gece sessizlik..."
                  : `Mesaj yaz...`
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={phase === "night" && !canUseMafiaChat}
              className="bg-gray-700/50 border-gray-600 text-white text-sm"
              maxLength={500}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(phase === "night" && !canUseMafiaChat) || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-2">
            {!isAlive ? "Olu oyuncular konusamaz" : "Chat kullanilmiyor"}
          </div>
        )}
      </div>
    </div>
  )
}

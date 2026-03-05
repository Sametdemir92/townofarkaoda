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

  const canChat = (isAlive && phase !== "lobby" && phase !== "ended") || (!isAlive && activeChannel === "DEAD")
  const canUseMafiaChat = myRole === "MAFYA" && phase === "night" && activeChannel === "MAFIA"
  const canUsePublicChat = isAlive && phase !== "night" && activeChannel === "PUBLIC"
  const canUseDeadChat = !isAlive && activeChannel === "DEAD"

  const showMafiaTab = myRole === "MAFYA"
  const showDeadTab = !isAlive

  // Seçili kanala göre mesaj gönderilebilir mi?
  const canSendMessageInCurrentChannel = canUsePublicChat || canUseMafiaChat || canUseDeadChat

  // Filtrelenmis mesajlar
  const filteredMessages = messages.filter((m) => {
    if (activeChannel === "SYSTEM") return m.channel === "SYSTEM"
    return m.channel === activeChannel
  })

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Chat Baslik + Tab'lar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <MessageSquare className="h-4 w-4 text-gray-400 shrink-0 ml-1" />
        <button
          onClick={() => onChannelChange("PUBLIC")}
          className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${activeChannel === "PUBLIC"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
          Genel
        </button>
        {showMafiaTab && (
          <button
            onClick={() => onChannelChange("MAFIA")}
            className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${activeChannel === "MAFIA"
              ? "bg-red-600 text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            Mafya
          </button>
        )}
        {showDeadTab && (
          <button
            onClick={() => onChannelChange("DEAD")}
            className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${activeChannel === "DEAD"
              ? "bg-purple-600 text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            Ölüler
          </button>
        )}
        <button
          onClick={() => onChannelChange("SYSTEM")}
          className={`px-3 py-1 rounded text-sm transition-colors whitespace-nowrap ${activeChannel === "SYSTEM"
            ? "bg-gray-500 text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
        >
          Sistem
        </button>
      </div>

      {/* Mesajlar */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[400px]">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-600 text-sm py-8">
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
                    className={`font-semibold text-sm shrink-0 ${msg.channel === "MAFIA" ? "text-red-500 dark:text-red-400" : msg.channel === "DEAD" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
                      }`}
                  >
                    {msg.username}:
                  </span>
                  <span className={`text-sm break-words ${msg.channel === "DEAD" ? "text-purple-900 dark:text-purple-200" : "text-gray-800 dark:text-gray-300"}`}>
                    {msg.content}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mesaj Girisi */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-transparent rounded-b-lg">
        {canChat ? (
          <div className="flex gap-2">
            <Input
              placeholder={
                !canSendMessageInCurrentChannel
                  ? "Bu kanalda şu an yazamazsın..."
                  : `Mesaj yaz...`
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!canSendMessageInCurrentChannel}
              className="bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
              maxLength={500}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!canSendMessageInCurrentChannel || !inputValue.trim()}
              className={`${activeChannel === "DEAD" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white shrink-0`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-500 text-sm py-2">
            Oyunu izliyorsun
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Zustand - Chat State Store
// ============================================

"use client"

import { create } from "zustand"
import type { ChatMessage, ChatChannel } from "@/types/game"

interface ChatStore {
  messages: ChatMessage[]
  activeChannel: ChatChannel
  addMessage: (message: ChatMessage) => void
  setActiveChannel: (channel: ChatChannel) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  activeChannel: "PUBLIC",

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  clearMessages: () => set({ messages: [] }),
}))

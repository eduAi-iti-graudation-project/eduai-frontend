import { useState, useCallback, useEffect } from "react"

export interface StoredChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface StoredConversation {
  id: string
  title: string | null
  lastMessage: string | null
  updatedAt: string
  scope?: unknown
  messages: StoredChatMessage[]
}

/**
 * Bounded, browser-local chat history for the computed Q&A assistants
 * (teacher "Students" tab, admin assistant). Keeps only the most recent
 * conversations so storage never grows unbounded.
 */
export function useLocalChatHistory(storageKey: string, maxItems = 10) {
  const [conversations, setConversations] = useState<StoredConversation[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as StoredConversation[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(conversations))
    } catch {
      // Storage full or unavailable — ignore, history stays in memory.
    }
  }, [storageKey, conversations])

  const upsert = useCallback(
    (conversation: StoredConversation) => {
      setConversations((prev) =>
        [conversation, ...prev.filter((c) => c.id !== conversation.id)].slice(0, maxItems),
      )
    },
    [maxItems],
  )

  const remove = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const clear = useCallback(() => setConversations([]), [])

  return { conversations, upsert, remove, clear }
}
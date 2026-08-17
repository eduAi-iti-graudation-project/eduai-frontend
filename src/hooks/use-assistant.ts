import { useState, useCallback, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export interface ChatMessageDisplay {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

/**
 * Course assistant chat with ChatGPT-style persistence. Conversations are
 * stored server-side (bounded to the newest few per teacher) and can be
 * resumed: opening a thread loads its full history and future messages
 * append to the same conversation.
 */
export function useAssistantChat(courseOfferingId: string | null) {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [conversations, setConversations] = useState<api.AiChatConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true)
    try {
      const data = await api.listAssistantConversations()
      setConversations(data.items)
    } catch {
      // Sidebar is non-critical; keep whatever we already have.
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshConversations()
    }, 0)
    return () => clearTimeout(t)
  }, [refreshConversations])

  const chatMutation = useMutation({
    mutationFn: (newMessage: string) =>
      api.sendChatMessage(
        courseOfferingId!,
        messages.map((m) => ({ role: m.role, content: m.content })),
        newMessage,
        activeConversationId ?? undefined,
      ),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        },
      ])
      if (data.conversationId) {
        setActiveConversationId(data.conversationId)
        void refreshConversations()
      }
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const sendMessage = useCallback(
    (content: string) => {
      if (!courseOfferingId || !content.trim()) return
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() },
      ])
      chatMutation.mutate(content)
    },
    [courseOfferingId, chatMutation],
  )

  const selectConversation = useCallback(
    async (conversationId: string) => {
      const conv = conversations.find((c) => c.id === conversationId)
      setActiveConversationId(conversationId)
      setMessagesLoading(true)
      try {
        const stored = await api.getAssistantConversation(conversationId)
        setMessages(
          stored.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          })),
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load this chat")
        setActiveConversationId(null)
        setMessages([])
      } finally {
        setMessagesLoading(false)
      }
      return conv
    },
    [conversations],
  )

  const newConversation = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
  }, [])

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.deleteAssistantConversation(conversationId)
        setConversations((prev) => prev.filter((c) => c.id !== conversationId))
        if (activeConversationId === conversationId) {
          setActiveConversationId(null)
          setMessages([])
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete this chat")
      }
    },
    [activeConversationId],
  )

  return {
    messages,
    messagesLoading,
    conversations,
    conversationsLoading,
    activeConversationId,
    sendMessage,
    selectConversation,
    newConversation,
    deleteConversation,
    refreshConversations,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
  }
}
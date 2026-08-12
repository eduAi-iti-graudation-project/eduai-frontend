import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export interface ChatMessageDisplay {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function useAssistantChat(courseOfferingId: string | null) {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([])

  const chatMutation = useMutation({
    mutationFn: (newMessage: string) =>
      api.sendChatMessage(
        courseOfferingId!,
        messages.map((m) => ({ role: m.role, content: m.content })),
        newMessage,
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

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
  }
}

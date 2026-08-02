import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export interface HomeworkHelpMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: string
  sources?: string[]
  teacherNotified?: boolean
  interactionId?: string
}

export function useHomeworkHelpChat(classId: string | null, assignmentId: string | null = null) {
  const [messages, setMessages] = useState<HomeworkHelpMessage[]>([])

  const chatMutation = useMutation({
    mutationFn: (question: string) =>
      api.askHomeworkHelp({
        classId: classId!,
        question,
        ...(assignmentId ? { assignmentId } : {}),
      }),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.interactionId || crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
          action: data.action,
          sources: data.sources,
          teacherNotified: data.teacherNotified,
          interactionId: data.interactionId || undefined,
        },
      ])
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const sendMessage = useCallback(
    (content: string) => {
      if (!classId || !content.trim()) return
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() },
      ])
      chatMutation.mutate(content)
    },
    [classId, chatMutation],
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

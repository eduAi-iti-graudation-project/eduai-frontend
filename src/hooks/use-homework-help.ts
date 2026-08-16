import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useOperations, useOperationId, useOperation } from "@/providers/use-operations"
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

export function useHomeworkHelpChat(courseOfferingId: string | null, assignmentId: string | null = null) {
  const [messages, setMessages] = useState<HomeworkHelpMessage[]>([])
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("homework-help")
  const active = useOperation("homework-help")
  const step = (active?.step ?? null) as api.HomeworkAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.HomeworkAgentStep | null
  const isLoading = active?.status === "running"

  const sendMessage = useCallback(
    (content: string) => {
      if (!courseOfferingId || !content.trim()) return
      const question = content.trim()

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: question, timestamp: new Date() },
      ])
      register({
        id: operationId,
        kind: "homework-help",
        label: "Asking the homework helper…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamHomeworkHelp(
          {
            courseOfferingId,
            question,
            ...(assignmentId ? { assignmentId } : {}),
          },
          {
            onStep: (s) => {
              update(operationId, {
                step: s,
                lastToolStep:
                  s === "search_material" || s === "search_assignment" || s === "search_web" ? s : null,
              })
            },
            onDone: (data) => {
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
              remove(operationId)
            },
          },
        )
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
        })
    },
    [courseOfferingId, assignmentId, operationId, register, update, remove],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    remove(operationId)
  }, [operationId, remove])

  return {
    messages,
    sendMessage,
    clearMessages,
    step,
    lastToolStep,
    isLoading,
  }
}

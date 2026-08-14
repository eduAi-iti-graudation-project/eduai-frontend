import { useState, useCallback } from "react"
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

export function useHomeworkHelpChat(courseOfferingId: string | null, assignmentId: string | null = null) {
  const [messages, setMessages] = useState<HomeworkHelpMessage[]>([])
  const [step, setStep] = useState<api.HomeworkAgentStep | null>(null)
  const [lastToolStep, setLastToolStep] = useState<api.HomeworkAgentStep | null>(null)

  const sendMessage = useCallback(
    (content: string) => {
      if (!courseOfferingId || !content.trim()) return
      const question = content.trim()

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: question, timestamp: new Date() },
      ])
      setStep("thinking")
      setLastToolStep(null)

      api
        .streamHomeworkHelp(
          {
            courseOfferingId,
            question,
            ...(assignmentId ? { assignmentId } : {}),
          },
          {
            onStep: (s) => {
              setStep(s)
              if (s === "search_material" || s === "search_assignment" || s === "search_web") {
                setLastToolStep(s)
              }
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
              setStep(null)
            },
          },
        )
        .catch((err: Error) => {
          setStep(null)
          toast.error(err.message)
        })
    },
    [courseOfferingId, assignmentId],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setStep(null)
    setLastToolStep(null)
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    step,
    lastToolStep,
    isLoading: step !== null,
  }
}

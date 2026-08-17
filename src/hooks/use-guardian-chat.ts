import { useCallback } from "react"
import { toast } from "sonner"
import { useOperations, useOperationId, useOperation } from "@/providers/use-operations"
import * as api from "@/lib/api"

/**
 * Streams the guardian copilot agent for a single child. The page owns the
 * message list, so streaming state is surfaced via the operations store and
 * the final reply is handed back through `onAssistantReply`.
 */
export function useGuardianChat(
  studentId: string,
  onAssistantReply: (reply: string, sources: string[], conversationId: string) => void,
) {
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("guardian-chat")
  const active = useOperation("guardian-chat")
  const step = (active?.step ?? null) as api.GuardianAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.GuardianAgentStep | null
  const isStreaming = active?.status === "running"

  const sendMessage = useCallback(
    (newMessage: string, history: api.GuardianChatMessage[], conversationId?: string) => {
      if (!studentId || !newMessage.trim()) return

      register({
        id: operationId,
        kind: "guardian-chat",
        label: "Asking the guardian copilot…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamGuardianChat(
          { studentId, messages: history, newMessage, ...(conversationId ? { conversationId } : {}) },
          {
            onStep: (s) => {
              update(operationId, {
                step: s,
                lastToolStep: s === "thinking" ? null : s,
              })
            },
            onDone: (data) => {
              onAssistantReply(data.reply, data.sources, data.conversationId)
              remove(operationId)
            },
          },
        )
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
        })
    },
    [studentId, operationId, register, update, remove, onAssistantReply],
  )

  return {
    sendMessage,
    step,
    lastToolStep,
    isStreaming,
  }
}
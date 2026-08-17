import { useCallback } from "react"
import { toast } from "sonner"
import { useOperations, useOperationId, useOperation } from "@/providers/use-operations"
import * as api from "@/lib/api"

export interface AdminChatScope {
  scopeStudentId?: string
  scopeTeacherId?: string
}

/**
 * Streams the admin copilot agent for a school-wide question or a single
 * scoped student/teacher profile. The page owns the message list, so streaming
 * state is surfaced via the operations store and the final reply is handed
 * back through `onAssistantReply`.
 */
export function useAdminAssistant(
  onAssistantReply: (reply: string, sources: string[], conversationId: string) => void,
) {
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("admin-chat")
  const active = useOperation("admin-chat")
  const step = (active?.step ?? null) as api.AdminAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.AdminAgentStep | null
  const isStreaming = active?.status === "running"

  const sendMessage = useCallback(
    (
      newMessage: string,
      history: api.GuardianChatMessage[],
      scope: AdminChatScope,
      conversationId?: string,
    ) => {
      if (!newMessage.trim()) return

      register({
        id: operationId,
        kind: "admin-chat",
        label: "Asking the admin copilot…",
        step: "read_overview",
        lastToolStep: null,
      })

      api
        .streamAdminChat(
          {
            ...(scope.scopeStudentId ? { scopeStudentId: scope.scopeStudentId } : {}),
            ...(scope.scopeTeacherId ? { scopeTeacherId: scope.scopeTeacherId } : {}),
            messages: history,
            newMessage,
            ...(conversationId ? { conversationId } : {}),
          },
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
    [operationId, register, update, remove, onAssistantReply],
  )

  return {
    sendMessage,
    step,
    lastToolStep,
    isStreaming,
  }
}
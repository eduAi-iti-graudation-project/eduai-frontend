import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useChatSocket } from "./use-chat-socket"
import { chatThreadsQueryKey } from "./use-chat-threads"

export function chatMessagesQueryKey(threadId: string) {
  return ["chat-threads", threadId, "messages"] as const
}

export function dedupeMessagesById(messages: api.ChatMessage[]): api.ChatMessage[] {
  const result: api.ChatMessage[] = []
  const indexById = new Map<string, number>()
  for (const message of messages) {
    const existing = indexById.get(message.id)
    if (existing === undefined) {
      indexById.set(message.id, result.length)
      result.push(message)
    } else {
      result[existing] = message
    }
  }
  return result
}

export function markCounterpartyRead(
  messages: api.ChatMessage[],
  myId: string,
  readAt: string,
): api.ChatMessage[] {
  return messages.map((message) =>
    message.authorId !== myId && message.readAt === null ? { ...message, readAt } : message,
  )
}

export function useChatMessages(threadId: string | undefined, myId: string | undefined) {
  const [messages, setMessages] = useState<api.ChatMessage[]>([])
  const [activeThreadId, setActiveThreadId] = useState(threadId)

  if (threadId !== activeThreadId) {
    setActiveThreadId(threadId)
    setMessages([])
  }

  const myIdRef = useRef(myId)
  useEffect(() => {
    myIdRef.current = myId
  }, [myId])

  const baseline = useQuery({
    queryKey: chatMessagesQueryKey(threadId ?? ""),
    queryFn: () => api.getChatMessages(threadId as string),
    enabled: !!threadId,
    staleTime: Infinity,
  })
  const baselineItems = baseline.data?.items ?? []

  const queryClient = useQueryClient()

  const markRead = useMutation({
    mutationFn: () => {
      if (!threadId) return Promise.resolve()
      return api.markThreadRead(threadId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatThreadsQueryKey() })
      if (myIdRef.current) {
        setMessages((prev) => markCounterpartyRead(prev, myIdRef.current as string, new Date().toISOString()))
      }
    },
    onError: () => undefined,
  })
  const markReadRef = useRef(markRead)
  useEffect(() => {
    markReadRef.current = markRead
  }, [markRead])

  const onJoined = useCallback((items: api.ChatMessage[]) => {
    setMessages((prev) => dedupeMessagesById([...prev, ...items]))
  }, [])
  const onMessage = useCallback((message: api.ChatMessage) => {
    setMessages((prev) => dedupeMessagesById([...prev, message]))
    if (typeof document !== "undefined" && document.hasFocus()) {
      markReadRef.current.mutate()
    }
  }, [])

  const { connected, socket } = useChatSocket(threadId, { onJoined, onMessage })

  useEffect(() => {
    if (!threadId) return
    markReadRef.current.mutate()
  }, [threadId])

  useEffect(() => {
    if (!threadId) return
    const onFocus = () => markReadRef.current.mutate()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [threadId])

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!threadId) throw new Error("No active thread")
      if (connected) {
        socket.emit("thread:send", { threadId, text })
        return undefined
      }
      return api.sendThreadMessage(threadId, text)
    },
    onSuccess: (message) => {
      if (message) setMessages((prev) => dedupeMessagesById([...prev, message]))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const allMessages = dedupeMessagesById([...baselineItems, ...messages])

  return { messages: allMessages, connected, send, markRead, initialLoading: baseline.isLoading }
}

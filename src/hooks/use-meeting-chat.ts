import { useCallback, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useMeetingSocket } from "./use-meeting-socket"

export function meetingMessagesQueryKey(meetingId: string) {
  return ["meetings", meetingId, "messages"] as const
}

export function meetingTranscriptQueryKey(meetingId: string) {
  return ["meetings", meetingId, "transcript"] as const
}

export function dedupeMeetingMessages(
  messages: api.MeetingMessage[],
): api.MeetingMessage[] {
  const byId = new Map<string, api.MeetingMessage>()
  for (const message of messages) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function useMeetingChat(meetingId: string | undefined) {
  const [live, setLive] = useState<api.MeetingMessage[]>([])

  const baseline = useQuery({
    queryKey: meetingMessagesQueryKey(meetingId ?? ""),
    queryFn: () => api.getMeetingMessages(meetingId as string),
    enabled: !!meetingId,
    staleTime: Infinity,
  })

  const onMessage = useCallback((message: api.MeetingMessage) => {
    setLive((prev) => dedupeMeetingMessages([...prev, message]))
  }, [])
  const onTranscript = useCallback(() => undefined, [])

  const { connected } = useMeetingSocket(meetingId, { onMessage, onTranscript })

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!meetingId) throw new Error("No active meeting")
      return api.sendMeetingMessage(meetingId, text)
    },
    onSuccess: (message) => {
      setLive((prev) => dedupeMeetingMessages([...prev, message]))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const messages = dedupeMeetingMessages([...(baseline.data?.messages ?? []), ...live])

  return {
    messages,
    connected,
    send,
    initialLoading: baseline.isLoading,
  }
}

export function useMeetingTranscript(meetingId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: meetingTranscriptQueryKey(meetingId ?? ""),
    queryFn: () => api.getMeetingTranscript(meetingId as string),
    enabled: !!meetingId,
    refetchInterval: (queryState) =>
      queryState.state.data?.status === "READY" || queryState.state.data?.status === "FAILED"
        ? false
        : 15000,
  })

  const onTranscript = useCallback(
    (payload: api.MeetingTranscript) => {
      if (meetingId) {
        queryClient.setQueryData(meetingTranscriptQueryKey(meetingId), payload)
      }
    },
    [meetingId, queryClient],
  )
  const onMessage = useCallback(() => undefined, [])

  useMeetingSocket(meetingId, { onMessage, onTranscript })

  return query
}

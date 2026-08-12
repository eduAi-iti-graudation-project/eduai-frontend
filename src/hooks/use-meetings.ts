import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function meetingsQueryKey(scope: api.MeetingSummary["status"] | "upcoming" | "past" | "all" = "all") {
  return ["meetings", scope] as const
}

export function meetingQueryKey(id: string) {
  return ["meetings", "detail", id] as const
}

export function struggleSignalsQueryKey(meetingId: string) {
  return ["meetings", meetingId, "struggle-signals"] as const
}

export function useMeetings(scope: "upcoming" | "past" | "all" = "all") {
  return useQuery({
    queryKey: meetingsQueryKey(scope),
    queryFn: () => api.listMeetings(scope),
  })
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: meetingQueryKey(id ?? ""),
    queryFn: () => api.getMeeting(id as string),
    enabled: !!id,
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: api.CreateMeetingInput) => api.createMeeting(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
      toast.success("Meeting scheduled")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useEndMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.endMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] })
      toast.success("Meeting ended")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useJoinMeeting() {
  return useMutation({
    mutationFn: (id: string) => api.joinMeeting(id),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSetMeetingRecording() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.setMeetingRecording(id, enabled),
    onSuccess: (meeting) => {
      queryClient.setQueryData(meetingQueryKey(meeting.id), meeting)
      toast.success(meeting.recordingEnabled ? "Recording started" : "Recording stopped")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

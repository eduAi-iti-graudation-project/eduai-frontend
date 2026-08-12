import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function chatThreadsQueryKey() {
  return ["chat-threads"] as const
}

export function useChatThreads(): UseQueryResult<api.ChatThreadListItem[]> {
  return useQuery({
    queryKey: chatThreadsQueryKey(),
    queryFn: () => api.getChatThreads(),
  })
}

export function useCreateChatThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseOfferingId, studentId }: { courseOfferingId: string; studentId?: string }) =>
      api.createOrGetChatThread(courseOfferingId, studentId),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: chatThreadsQueryKey() })
      return thread
    },
  })
}

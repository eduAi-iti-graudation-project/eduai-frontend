import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => api.getNotifications(userId),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    markRead,
    refetch: query.refetch,
  }
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useNotifications() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.markNotificationRead(id))),
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
    markAllRead,
    refetch: query.refetch,
  }
}

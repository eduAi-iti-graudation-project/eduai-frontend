import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useAlerts(status?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["alerts", status],
    queryFn: () => api.getAlerts(status),
  })

  const resolve = useMutation({
    mutationFn: ({ id, status: newStatus }: { id: string; status: "RESOLVED" | "DISMISSED" }) =>
      api.resolveAlert(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
    },
  })

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    resolve,
    refetch: query.refetch,
  }
}

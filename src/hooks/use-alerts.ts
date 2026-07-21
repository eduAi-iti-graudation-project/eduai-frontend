import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useAlerts(status?: string) {
  const alerts = useQuery({
    queryKey: ["alerts", status],
    queryFn: () => api.getAlerts(status),
  })

  return {
    alerts,
    isLoading: alerts.isLoading,
    isError: alerts.isError,
    error: alerts.error,
  }
}

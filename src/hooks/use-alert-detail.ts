import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useAlertDetail(id: string) {
  return useQuery({
    queryKey: ["alert", id],
    queryFn: () => api.getAlertDetail(id),
    enabled: !!id,
  })
}

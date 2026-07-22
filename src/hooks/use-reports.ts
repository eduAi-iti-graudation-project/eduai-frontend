import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useReports(studentId?: string) {
  const query = useQuery({
    queryKey: ["reports", studentId],
    queryFn: () => api.getReports(studentId),
  })

  return {
    reports: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => api.getReport(id),
    enabled: !!id,
  })
}

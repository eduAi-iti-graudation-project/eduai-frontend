import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import * as api from "@/lib/api"

export type InsightsInterval = "week" | "month"

export function dashboardInsightsQueryKey(interval: InsightsInterval) {
  return ["dashboard-insights", { interval }] as const
}

export function studentInsightsQueryKey(studentId: string, interval: InsightsInterval) {
  return ["dashboard-insights", { studentId, interval }] as const
}

export function useDashboardInsights(
  interval: InsightsInterval,
): UseQueryResult<api.InsightsResponse> {
  return useQuery({
    queryKey: dashboardInsightsQueryKey(interval),
    queryFn: () => api.getDashboardInsights(interval),
  })
}

export function useStudentInsights(
  studentId: string,
  interval: InsightsInterval,
): UseQueryResult<api.InsightsResponse> {
  return useQuery({
    queryKey: studentInsightsQueryKey(studentId, interval),
    queryFn: () => api.getStudentInsights(studentId, interval),
    enabled: !!studentId,
  })
}

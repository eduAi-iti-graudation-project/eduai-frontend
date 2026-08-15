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

export function sectionDetailQueryKey(
  sectionKey: string,
  interval: InsightsInterval,
  bucket: string,
  studentId?: string,
) {
  return studentId
    ? (["dashboard-insights", { studentId, sectionKey, interval, bucket }] as const)
    : (["dashboard-insights", { sectionKey, interval, bucket }] as const)
}

export function useSectionDetail(
  sectionKey: string,
  interval: InsightsInterval,
  bucket: string,
  studentId: string | undefined,
  enabled: boolean,
): UseQueryResult<api.SectionDetail> {
  return useQuery({
    queryKey: sectionDetailQueryKey(sectionKey, interval, bucket, studentId),
    queryFn: () =>
      studentId
        ? api.getStudentSectionDetail(studentId, interval, sectionKey, bucket)
        : api.getDashboardSectionDetail(interval, sectionKey, bucket),
    enabled: enabled && !!sectionKey && !!bucket,
  })
}

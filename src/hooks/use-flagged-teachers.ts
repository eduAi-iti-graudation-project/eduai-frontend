import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import * as api from "@/lib/api"

export type FlaggedTeacher = api.TeacherFlag

export function useFlaggedTeachers(): UseQueryResult<FlaggedTeacher[]> {
 return useQuery({
  queryKey: ["flagged-teachers"],
  queryFn: () => api.getTeacherFlags(),
 })
}
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"

export function useStudentGrades(studentId: string) {
  return useQuery({
    queryKey: ["student-grades", studentId],
    queryFn: () => api.getStudentGrades(studentId),
    enabled: !!studentId,
  })
}

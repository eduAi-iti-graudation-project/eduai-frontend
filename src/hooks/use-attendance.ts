import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import type { ImportAttendanceRecord } from "@/lib/api"

export function useClassAttendance(classId: string) {
  return useQuery({
    queryKey: ["attendance", "class", classId],
    queryFn: () => api.getClassAttendance(classId),
    enabled: !!classId,
  })
}

export function useStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: ["attendance", "student", studentId],
    queryFn: () => api.getStudentAttendance(studentId),
    enabled: !!studentId,
  })
}

export function useImportAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (records: ImportAttendanceRecord[]) => api.importAttendance(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

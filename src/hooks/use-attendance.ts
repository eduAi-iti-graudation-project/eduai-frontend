import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import type { ImportAttendanceRecord, TeacherFineInput } from "@/lib/api"

export function useClassAttendance(classId: string) {
  return useQuery({
    queryKey: ["attendance", "class", classId],
    queryFn: () => api.getClassAttendance(classId),
    enabled: !!classId,
  })
}

export function useOfferingAttendance(offeringId: string) {
  return useQuery({
    queryKey: ["attendance", "offering", offeringId],
    queryFn: () => api.getOfferingAttendance(offeringId),
    enabled: !!offeringId,
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

export function useOpenAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseOfferingId: string) => api.openAttendanceSession(courseOfferingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "teacher"] })
    },
  })
}

export function useCloseAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => api.closeAttendanceSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "teacher"] })
    },
  })
}

export function useAttendanceSession(sessionId: string) {
  return useQuery({
    queryKey: ["attendance", "session", sessionId],
    queryFn: () => api.getAttendanceSession(sessionId),
    enabled: !!sessionId,
  })
}

export function useCheckInAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => api.checkInAttendance(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
  })
}

export function useMyTeacherAttendance() {
  return useQuery({
    queryKey: ["attendance", "teacher", "my"],
    queryFn: () => api.getMyTeacherAttendance(),
  })
}

export function useMyTeacherFines() {
  return useQuery({
    queryKey: ["attendance", "teacher", "my-fines"],
    queryFn: () => api.getMyTeacherFines(),
  })
}

export function useTeacherAttendanceLedger(query: api.TeacherAttendanceLedgerQuery = {}) {
  return useQuery({
    queryKey: ["attendance", "teachers", query],
    queryFn: () => api.getTeacherAttendanceLedger(query),
  })
}

export function useTeacherAttendance(teacherId: string) {
  return useQuery({
    queryKey: ["attendance", "teacher", teacherId],
    queryFn: () => api.getTeacherAttendanceById(teacherId),
    enabled: !!teacherId,
  })
}

export function useTeacherFines(teacherId: string) {
  return useQuery({
    queryKey: ["fines", "teacher", teacherId],
    queryFn: () => api.getTeacherFines(teacherId),
    enabled: !!teacherId,
  })
}

export function useCreateTeacherFine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teacherId, payload }: { teacherId: string; payload: TeacherFineInput }) =>
      api.createTeacherFine(teacherId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines"] })
    },
  })
}

export function useUpdateTeacherFine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fineId, payload }: { fineId: string; payload: Partial<TeacherFineInput> }) =>
      api.updateTeacherFine(fineId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines"] })
    },
  })
}

export function useDeleteTeacherFine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fineId: string) => api.deleteTeacherFine(fineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines"] })
    },
  })
}
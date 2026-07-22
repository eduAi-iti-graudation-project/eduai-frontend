import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { toast } from "sonner"

export function useClasses() {
  const queryClient = useQueryClient()

  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: api.getClasses,
  })

  const createClass = useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class created")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const updateClass = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      api.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class updated")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const deleteClass = useMutation({
    mutationFn: (id: string) => api.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class deleted")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const addEnrollment = useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      api.addEnrollment(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Student enrolled")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const removeEnrollment = useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      api.removeEnrollment(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Enrollment removed")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    classes,
    isLoading: classes.isLoading,
    isError: classes.isError,
    error: classes.error,
    classCards: (classes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      section: c.description ?? "No description",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      students: (c as any).enrollments?.length ?? 0,
    })),
    createClass,
    updateClass,
    deleteClass,
    addEnrollment,
    removeEnrollment,
  }
}

export function useClassDetail(id: string) {
  const queryClient = useQueryClient()

  const detail = useQuery({
    queryKey: ["class", id],
    queryFn: () => api.getClass(id),
    enabled: !!id,
  })

  const assignments = useQuery({
    queryKey: ["assignments", id],
    queryFn: () => api.getAssignments(id),
    enabled: !!id,
  })

  const submissions = useQuery({
    queryKey: ["submissions", "class", id],
    queryFn: () => api.getSubmissions().then((subs) => {
      const assignmentIds = new Set((assignments.data ?? []).map((a) => a.id))
      return subs.filter((s) => assignmentIds.has(s.assignmentId))
    }),
    enabled: !!id && !!assignments.data,
  })

  const updateClass = useMutation({
    mutationFn: (data: { name?: string; description?: string }) => api.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteClass = useMutation({
    mutationFn: () => api.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      toast.success("Class deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createAssignment = useMutation({
    mutationFn: (data: { title: string; description?: string; dueDate: string; totalPoints: number }) =>
      api.createAssignment({ ...data, classId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", id] })
      toast.success("Assignment created")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteAssignment = useMutation({
    mutationFn: (assignmentId: string) => api.deleteAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", id] })
      toast.success("Assignment deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addEnrollment = useMutation({
    mutationFn: (studentId: string) => api.addEnrollment(id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      toast.success("Student enrolled")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeEnrollment = useMutation({
    mutationFn: (studentId: string) => api.removeEnrollment(id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      toast.success("Enrollment removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return {
    detail,
    assignments,
    submissions,
    isLoading: detail.isLoading,
    isError: detail.isError,
    error: detail.error,
    updateClass,
    deleteClass,
    createAssignment,
    deleteAssignment,
    addEnrollment,
    removeEnrollment,
  }
}

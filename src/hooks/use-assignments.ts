import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function useAssignments(courseOfferingId?: string) {
  return useQuery({
    queryKey: ["assignments", courseOfferingId ?? "all"],
    queryFn: () => api.getAssignments(courseOfferingId),
  })
}

export function useGenerateCourseAssignmentDraft() {
  return useMutation({
    mutationFn: (data: api.GenerateCourseAssignmentDto) =>
      api.generateCourseAssignmentDraft(data),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSaveGeneratedAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: api.SaveGeneratedAssignmentsDto) =>
      api.saveGeneratedAssignments(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] })
      queryClient.invalidateQueries({ queryKey: ["rubrics"] })
      toast.success("Assignments created with confirmed rubrics")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] })
      toast.success("Assignment deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
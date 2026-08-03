import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"
import type { SubmissionEnriched } from "@/lib/api"

export function useSubmissions(status?: string, assignmentId?: string) {
  const queryClient = useQueryClient()

  const submissions = useQuery({
    queryKey: ["submissions", status, assignmentId],
    queryFn: () => api.getSubmissions(status, assignmentId),
    staleTime: 0,
  })

  const gradeSubmission = useMutation({
    mutationFn: (submissionId: string) => api.gradeSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("AI grading started")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateGrade = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { pointsAwarded: number; teacherNotes?: string } }) =>
      api.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("Score updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const confirmGrade = useMutation({
    mutationFn: (submission: SubmissionEnriched) => api.confirmAllGrades(submission.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      toast.success("Grade confirmed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return {
    submissions,
    isLoading: submissions.isLoading,
    isError: submissions.isError,
    error: submissions.error,
    gradeSubmission,
    updateGrade,
    confirmGrade,
  }
}

export function useSubmissionDetail(id: string) {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => api.getSubmission(id),
    enabled: !!id,
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function useRubrics(assignmentId?: string) {
  const queryClient = useQueryClient()

  const rubrics = useQuery({
    queryKey: ["rubrics", assignmentId],
    queryFn: () => api.getRubrics(assignmentId),
  })

  const createRubric = useMutation({
    mutationFn: (data: { title: string; assignmentId: string; criteria: { description: string; maxPoints: number }[] }) =>
      api.createRubric(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] })
      toast.success("Rubric created")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const importRubricPdf = useMutation({
    mutationFn: (formData: FormData) => api.createRubricFromPdf(formData),
    onSuccess: (data) => {
      toast.success(`Extracted ${data.criteria.length} criteria from PDF`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const confirmRubric = useMutation({
    mutationFn: (id: string) => api.confirmRubric(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] })
      toast.success("Rubric confirmed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return {
    rubrics,
    isLoading: rubrics.isLoading,
    isError: rubrics.isError,
    error: rubrics.error,
    createRubric,
    importRubricPdf,
    confirmRubric,
  }
}

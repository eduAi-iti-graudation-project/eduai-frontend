import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useOperations, useOperationId, useOperation } from "@/providers/use-operations"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function useQuizList(courseOfferingId?: string) {
  return useQuery({
    queryKey: ["quizzes", courseOfferingId ?? "all"],
    queryFn: () => api.getQuizzes(courseOfferingId),
  })
}

export function useStudentQuizList() {
  return useQuery({
    queryKey: ["quizzes", "student"],
    queryFn: api.getStudentQuizzes,
  })
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ["quiz", id],
    queryFn: () => api.getQuiz(id),
    enabled: !!id,
  })
}

export function useAttempt(attemptId: string) {
  return useQuery({
    queryKey: ["quiz-attempt", attemptId],
    queryFn: () => api.getQuizAttempt(attemptId),
    enabled: !!attemptId,
  })
}

export function useAttemptsByQuiz(quizId: string) {
  return useQuery({
    queryKey: ["quiz", quizId, "attempts"],
    queryFn: () => api.getQuizAttempts(quizId),
    enabled: !!quizId,
  })
}

export function useCreateQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: api.CreateQuizDto) => api.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Quiz created")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient()
  const { register, update, remove } = useOperations()
  const operationId = useOperationId("quiz-generate")
  const active = useOperation("quiz-generate")
  const step = (active?.step ?? null) as api.QuizAgentStep | null
  const lastToolStep = (active?.lastToolStep ?? null) as api.QuizAgentStep | null
  const isLoading = active?.status === "running"

  const mutate = useCallback(
    (
      data: api.GenerateQuizDto,
      handlers?: {
        onDone?: (result: api.GenerateQuizResult) => void
        onError?: (err: Error) => void
      },
    ) => {
      register({
        id: operationId,
        kind: "quiz-generate",
        label: "Generating quiz…",
        step: "thinking",
        lastToolStep: null,
      })

      api
        .streamGenerateQuiz(data, {
          onStep: (s) => {
            update(operationId, { step: s, lastToolStep: s !== "thinking" ? s : null })
          },
          onDone: (result) => {
            remove(operationId)
            if (result.quizId) {
              queryClient.invalidateQueries({ queryKey: ["quizzes"] })
              toast.success("Quiz generated")
            } else {
              toast.warning(
                result.message || "Quiz could not be generated for this unit",
              )
            }
            handlers?.onDone?.(result)
          },
        })
        .catch((err: Error) => {
          remove(operationId)
          toast.error(err.message)
          handlers?.onError?.(err)
        })
    },
    [operationId, register, update, remove, queryClient],
  )

  return { mutate, isPending: isLoading, isLoading, step, lastToolStep }
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<api.CreateQuizDto> & { status?: api.QuizStatus } }) =>
      api.updateQuiz(id, data),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quiz.id] })
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Quiz updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function usePublishQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.publishQuiz(id),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quiz.id] })
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Quiz published")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Quiz deleted")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAssignQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assignments }: { id: string; assignments: api.QuizAssignmentInput[] }) =>
      api.assignQuiz(id, assignments),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quiz.id] })
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Quiz assigned")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRemoveQuizAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => api.removeQuizAssignment(assignmentId),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", quiz.id] })
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Assignment removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useConfirmAttempt(attemptId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.confirmQuizAttempt(attemptId),
    onSuccess: (detail) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt", attemptId] })
      queryClient.invalidateQueries({ queryKey: ["quiz", detail.quizId, "attempts"] })
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
      toast.success("Grades confirmed")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ answerId, pointsAwarded }: { answerId: string; pointsAwarded: number }) =>
      api.updateQuizAnswer(answerId, pointsAwarded),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt"] })
      toast.success("Points updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

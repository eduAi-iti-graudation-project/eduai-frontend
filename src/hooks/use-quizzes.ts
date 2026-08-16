import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function useQuizList(classId?: string) {
  return useQuery({
    queryKey: ["quizzes", classId ?? "all"],
    queryFn: () => api.getQuizzes(classId),
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
  return useMutation({
    mutationFn: (data: api.GenerateQuizDto) => api.generateQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
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

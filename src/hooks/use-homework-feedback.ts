import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function useHomeworkHelpFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ interactionId, feedback }: { interactionId: string; feedback: api.HomeworkHelpFeedbackValue }) =>
      api.submitHomeworkHelpFeedback(interactionId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-help", "history"] })
    },
    onError: () => {
      toast.error("Failed to save feedback")
    },
  })
}

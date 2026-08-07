import { useState } from "react"
import { cn } from "@/lib/utils"
import { useHomeworkHelpFeedback } from "@/hooks/use-homework-feedback"
import type { HomeworkHelpFeedbackValue } from "@/lib/api"

interface FeedbackButtonsProps {
  interactionId?: string
  currentFeedback: HomeworkHelpFeedbackValue | null
  onFeedback?: (feedback: HomeworkHelpFeedbackValue) => void
  className?: string
}

export function FeedbackButtons({ interactionId, currentFeedback, onFeedback, className }: FeedbackButtonsProps) {
  const feedbackMutation = useHomeworkHelpFeedback()
  const [localFeedback, setLocalFeedback] = useState<HomeworkHelpFeedbackValue | null>(null)

  if (!interactionId) return null

  const id = interactionId
  const feedback = localFeedback ?? currentFeedback
  const isPending = feedbackMutation.isPending
  const disabled = !!feedback || isPending

  function handleClick(value: HomeworkHelpFeedbackValue) {
    if (disabled) return
    feedbackMutation.mutate(
      { interactionId: id, feedback: value },
      {
        onSuccess: () => {
          setLocalFeedback(value)
          onFeedback?.(value)
        },
      },
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {feedback ? (feedback === "HELPFUL" ? "✅ Helpful" : "❌ Not Helpful") : "Was this helpful?"}
      </span>
      <button
        onClick={() => handleClick("HELPFUL")}
        disabled={disabled}
        title="Helpful"
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[16px]",
          feedback === "HELPFUL"
            ? "bg-primary-container text-on-primary-container"
            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
          disabled && !feedback && "opacity-50 cursor-not-allowed",
          disabled && feedback !== "HELPFUL" && "opacity-40",
        )}
      >
        👍
      </button>
      <button
        onClick={() => handleClick("NOT_HELPFUL")}
        disabled={disabled}
        title="Not helpful"
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[16px]",
          feedback === "NOT_HELPFUL"
            ? "bg-error-container text-on-error-container"
            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
          disabled && !feedback && "opacity-50 cursor-not-allowed",
          disabled && feedback !== "NOT_HELPFUL" && "opacity-40",
        )}
      >
        👎
      </button>
    </div>
  )
}

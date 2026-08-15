import { cn } from "@/lib/utils"
import type { QuizDifficulty } from "@/lib/api"

const difficultyStyles: Record<QuizDifficulty, string> = {
  EASY: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HARD: "bg-red-100 text-red-700",
}

const difficultyLabels: Record<QuizDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
}

interface QuizDifficultyBadgeProps {
  difficulty: QuizDifficulty
  className?: string
}

export function QuizDifficultyBadge({ difficulty, className }: QuizDifficultyBadgeProps) {
  return (
    <span className={cn("font-label-sm text-label-sm px-sm py-1 rounded-md", difficultyStyles[difficulty], className)}>
      {difficultyLabels[difficulty]}
    </span>
  )
}
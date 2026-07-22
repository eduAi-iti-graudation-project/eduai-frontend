import { useState } from "react"
import { cn } from "@/lib/utils"

interface CriteriaRowProps {
  description: string
  maxPoints: number
  aiScore: number | null
  aiFeedback: string | null
  onTeacherScoreChange?: (score: number) => void
  onConfirm?: () => void
  confirmed?: boolean
  className?: string
}

export function CriteriaRow({
  description,
  maxPoints,
  aiScore,
  aiFeedback,
  onTeacherScoreChange,
  onConfirm,
  confirmed = false,
  className,
}: CriteriaRowProps) {
  const [teacherScore, setTeacherScore] = useState<number | "">("")

  const handleScoreChange = (value: string) => {
    const parsed = parseInt(value, 10)
    if (value === "") {
      setTeacherScore("")
      onTeacherScoreChange?.(0)
      return
    }
    if (!isNaN(parsed) && parsed >= 0 && parsed <= maxPoints) {
      setTeacherScore(parsed)
      onTeacherScoreChange?.(parsed)
    }
  }

  return (
    <div className={cn("p-md rounded-xl border-2 border-outline-variant/10 space-y-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-label-md text-label-md text-on-surface flex-1">{description}</p>
        <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
          {maxPoints} pts
        </span>
      </div>

      {aiScore !== null && (
        <div className="flex items-center gap-2 bg-primary-fixed/10 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
          <span className="font-label-sm text-label-sm text-primary font-bold">AI: {aiScore}/{maxPoints}</span>
          {aiFeedback && (
            <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">— {aiFeedback}</span>
          )}
        </div>
      )}

      {!confirmed && (
        <div className="flex items-center gap-3 pt-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Your score:</label>
          <input
            type="number"
            min={0}
            max={maxPoints}
            value={teacherScore}
            onChange={(e) => handleScoreChange(e.target.value)}
            placeholder={aiScore !== null ? String(aiScore) : "—"}
            className="w-20 h-9 px-2 bg-surface border-2 border-outline-variant/30 rounded-xl text-center font-body-md text-body-md text-on-surface focus:border-primary focus:ring-0 transition-all"
          />
          {onConfirm && teacherScore !== "" && Number(teacherScore) >= 0 && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-3 py-1.5 bg-primary-container text-white font-label-sm text-label-sm rounded-full hover:opacity-90 active:scale-95 transition-all"
            >
              Confirm
            </button>
          )}
        </div>
      )}

      {confirmed && (
        <div className="flex items-center gap-1 text-primary-container">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-label-sm text-label-sm">Confirmed</span>
        </div>
      )}
    </div>
  )
}

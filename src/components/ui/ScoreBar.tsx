import { cn } from "@/lib/utils"

interface ScoreBarProps {
  earned: number
  max: number
  className?: string
}

export function ScoreBar({ earned, max, className }: ScoreBarProps) {
  const pct = max > 0 ? Math.min(Math.round((earned / max) * 100), 100) : 0

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-3 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-container transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
        {earned}/{max}
        <span className="text-outline ml-1">({pct}%)</span>
      </span>
    </div>
  )
}

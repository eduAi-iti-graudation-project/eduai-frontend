import { Progress } from "@/components/ui/progress"
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
   <Progress
    value={pct}
    className="flex-1 h-3 rounded-lg bg-surface-container-high [&>div]:bg-primary-container [&>div]:transition-all [&>div]:duration-500"
    aria-label={`Score ${earned} out of ${max}`}
   />
   <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
    {earned}/{max}
    <span className="text-outline ml-1">({pct}%)</span>
   </span>
  </div>
 )
}

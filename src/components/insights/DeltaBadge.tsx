import { cn } from "@/lib/utils"
import type { InsightDirection } from "@/lib/api"
import { directionStyles, formatPercent } from "@/components/insights/delta-utils"

interface DeltaBadgeProps {
 deltaPercent: number
 direction: InsightDirection
 className?: string
}

const directionArrows: Record<InsightDirection, string> = {
 up: "↑",
 down: "↓",
 flat: "→",
}

export function DeltaBadge({ deltaPercent, direction, className }: DeltaBadgeProps) {
 return (
  <span
   className={cn(
    "inline-flex items-center gap-1 font-label-md text-label-md px-2.5 py-1 rounded-lg",
    directionStyles[direction],
    className,
   )}
   aria-label={`${direction} ${formatPercent(deltaPercent)}`}
  >
   <span aria-hidden="true">{directionArrows[direction]}</span>
   {formatPercent(deltaPercent)}
  </span>
 )
}

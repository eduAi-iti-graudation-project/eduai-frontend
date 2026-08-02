import { cn } from "@/lib/utils"
import type { QuizStatus } from "@/lib/api"

const statusStyles: Record<QuizStatus, string> = {
  DRAFT: "bg-surface-variant text-on-surface-variant",
  PUBLISHED: "bg-primary-fixed text-primary",
  CLOSED: "bg-black text-white",
}

const statusLabels: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
}

interface QuizStatusBadgeProps {
  status: QuizStatus
  className?: string
}

export function QuizStatusBadge({ status, className }: QuizStatusBadgeProps) {
  return (
    <span className={cn("font-label-sm text-label-sm px-sm py-1 rounded-full", statusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  )
}

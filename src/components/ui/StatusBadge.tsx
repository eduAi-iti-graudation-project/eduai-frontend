import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SubmissionStatus = "SUBMITTED" | "GRADING_IN_PROGRESS" | "REVIEW_READY" | "CONFIRMED"

const statusStyles: Record<SubmissionStatus, string> = {
 SUBMITTED: "bg-surface-container-high text-on-surface",
 GRADING_IN_PROGRESS: "bg-surface-container-high text-on-surface",
 REVIEW_READY: "bg-primary text-primary-foreground",
 CONFIRMED: "bg-primary text-primary-foreground",
}

const statusLabels: Record<SubmissionStatus, string> = {
 SUBMITTED: "Submitted",
 GRADING_IN_PROGRESS: "Grading...",
 REVIEW_READY: "Review Ready",
 CONFIRMED: "Confirmed",
}

interface StatusBadgeProps extends Omit<BadgeProps, "status"> {
 status: SubmissionStatus
 className?: string
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
 return (
  <Badge
   variant="outline"
   className={cn(
    "font-label-sm text-label-sm px-sm py-1 rounded-lg border-0",
    statusStyles[status],
    className,
   )}
   {...props}
  >
   {statusLabels[status]}
  </Badge>
 )
}

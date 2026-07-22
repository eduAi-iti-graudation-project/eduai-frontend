import { cn } from "@/lib/utils"

export type SubmissionStatus = "SUBMITTED" | "GRADING_IN_PROGRESS" | "REVIEW_READY" | "CONFIRMED"

const statusStyles: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-tertiary-fixed text-on-tertiary-fixed",
  GRADING_IN_PROGRESS: "bg-primary-fixed/20 text-primary",
  REVIEW_READY: "bg-secondary-container text-white",
  CONFIRMED: "bg-primary-container text-white",
}

const statusLabels: Record<SubmissionStatus, string> = {
  SUBMITTED: "Submitted",
  GRADING_IN_PROGRESS: "Grading...",
  REVIEW_READY: "Review Ready",
  CONFIRMED: "Confirmed",
}

interface StatusBadgeProps {
  status: SubmissionStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "font-label-sm text-label-sm px-sm py-1 rounded-full",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

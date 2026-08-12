import type { LabStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<LabStatus, { label: string; className: string }> = {
  GENERATING: { label: "Generating…", className: "bg-amber-100 text-amber-700" },
  AI_REVIEW_FAILED: { label: "AI review failed", className: "bg-red-100 text-red-700" },
  PENDING_TEACHER_REVIEW: { label: "Pending review", className: "bg-blue-100 text-blue-700" },
  PUBLISHED: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", className: "bg-slate-200 text-slate-600" },
}

export function LabStatusChip({ status, className }: { status: LabStatus; className?: string }) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-label-sm text-label-sm",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  )
}
import type { LabStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<LabStatus, { label: string; className: string }> = {
GENERATING: { label: "Generating…", className: "bg-highlight/20 text-highlight" },
 AI_REVIEW_FAILED: { label: "Generation failed", className: "bg-danger/15 text-danger" },
 PENDING_TEACHER_REVIEW: { label: "Pending review", className: "bg-primary-container text-on-primary-container" },
 PUBLISHED: { label: "Published", className: "bg-success/15 text-success" },
 REJECTED: { label: "Rejected", className: "bg-surface-container-high text-on-surface-variant" },
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MeetingStatus, TranscriptStatus } from "@/lib/api"

const statusStyles: Record<MeetingStatus, string> = {
 SCHEDULED: "bg-surface-container-high text-on-surface-variant",
 LIVE: "bg-success-container text-on-success-container",
 ENDED: "bg-surface-container-high text-on-surface-variant",
 CANCELED: "bg-error-container text-on-error-container",
}

const statusLabels: Record<MeetingStatus, string> = {
 SCHEDULED: "Scheduled",
 LIVE: "Live now",
 ENDED: "Ended",
 CANCELED: "Canceled",
}

const transcriptLabels: Record<TranscriptStatus, string> = {
 PENDING: "Transcript pending",
 PROCESSING: "Transcribing…",
 READY: "Transcript ready",
 FAILED: "Transcript failed",
}

export function MeetingStatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
 return (
  <Badge variant="outline" className={cn("font-label-sm text-label-sm px-sm py-1 rounded-lg border-0", statusStyles[status], className)}>
   {statusLabels[status]}
  </Badge>
 )
}

export function TranscriptStatusBadge({ status, className }: { status: TranscriptStatus; className?: string }) {
 const styles: Record<TranscriptStatus, string> = {
  PENDING: "bg-surface-container-high text-on-surface-variant",
  PROCESSING: "bg-primary-container text-on-primary-container",
  READY: "bg-success-container text-on-success-container",
  FAILED: "bg-error-container text-on-error-container",
 }
 return (
  <Badge variant="outline" className={cn("font-label-sm text-label-sm px-sm py-1 rounded-lg border-0", styles[status], className)}>
   {transcriptLabels[status]}
  </Badge>
 )
}

import { Link } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FriendlyAlert, SeverityPill } from "@/components/admin/AlertPresentation"
import type { AlertListItem } from "@/lib/api"

interface AlertCardProps {
 alert: AlertListItem
 onResolve?: () => void
 className?: string
}

const statusMeta: Record<string, { label: string; className: string }> = {
 NEW: { label: "New", className: "bg-primary text-primary-foreground border-0" },
 ACKNOWLEDGED: { label: "Acknowledged", className: "bg-surface-container-high text-on-surface border-0" },
 RESOLVED: { label: "Resolved", className: "bg-surface-container-high text-on-surface-variant border-0" },
}

function initialsOf(name: string): string {
 return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((w) => w.charAt(0).toUpperCase())
  .join("")
}

function formatTime(iso: string): string {
 const date = new Date(iso)
 const diffMs = Date.now() - date.getTime()
 const minutes = Math.floor(diffMs / 60000)
 if (minutes < 1) return "Just now"
 if (minutes < 60) return `${minutes}m ago`
 const hours = Math.floor(minutes / 60)
 if (hours < 24) return `${hours}h ago`
 const days = Math.floor(hours / 24)
 if (days < 7) return `${days}d ago`
 return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function AlertCard({ alert, onResolve, className }: AlertCardProps) {
 const status = statusMeta[alert.status] ?? {
  label: alert.status.replace(/_/g, " ").toLowerCase(),
  className: "bg-surface-container-low text-on-surface border-0",
 }
 const gradeLabel = alert.grade ? `Grade ${alert.grade.level}` : null
 const classLabel = alert.className ? `${gradeLabel ? `${gradeLabel} · ` : ""}${alert.className}` : gradeLabel

 return (
  <Card
   className={cn(
    "rounded-lg bg-surface-container-lowest shadow-none group",
    className,
   )}
  >
   <div className="flex items-start gap-4 p-4">
    <FriendlyAlert alert={alert} className="flex-1 min-w-0" />
    <div className="flex flex-col items-end gap-2 shrink-0">
     <SeverityPill severity={alert.severity} severityText />
     <Badge
      variant="outline"
      className={cn(
       "font-label-sm text-label-sm px-2 py-0.5 rounded-md",
       status.className,
      )}
     >
      {status.label}
     </Badge>
    </div>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
    <div className="flex items-center gap-3 min-w-0">
     <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0">
      {initialsOf(alert.studentName)}
     </div>
     <div className="min-w-0">
      <p className="font-label-md text-label-md text-on-surface truncate">
       {alert.studentName}
       {classLabel && <span className="text-on-surface-variant font-normal"> · {classLabel}</span>}
      </p>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{formatTime(alert.createdAt)}</p>
     </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
     {onResolve && (
      <button
       type="button"
       onClick={onResolve}
       className="px-3 py-1.5 bg-primary text-primary-foreground font-label-sm text-label-sm rounded-md hover:opacity-90 active:scale-95 transition-all"
      >
       Resolve
      </button>
     )}
     <Link
      to={`/alerts/${alert.id}`}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container text-on-surface-variant font-label-sm text-label-sm rounded-md hover:bg-surface-container-high transition-colors"
     >
      Details
      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
     </Link>
    </div>
   </div>
  </Card>
 )
}
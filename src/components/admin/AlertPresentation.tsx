import type { AlertListItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import { alertMeta, severityChipClass, severityLabel } from "./alertPresentation"

interface FriendlyAlertProps {
 alert: Pick<AlertListItem, "type" | "reason" | "severity" | "skillGapCount">
 className?: string
}

export function FriendlyAlert({ alert, className }: FriendlyAlertProps) {
 const meta = alertMeta(alert.type)
 return (
  <div className={cn("flex items-start gap-3 min-w-0", className)}>
   <span className={cn("inline-flex items-center justify-center h-8 w-8 rounded-md shrink-0", meta.iconChip)}>
    <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
   </span>
   <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 flex-wrap">
     <p className="font-label-md text-label-md text-on-surface font-semibold">{meta.title}</p>
     {alert.skillGapCount > 0 && (
      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold">
       {alert.skillGapCount} skill{alert.skillGapCount === 1 ? "" : "s"} to target
      </span>
     )}
    </div>
    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
     {alert.reason}
    </p>
   </div>
  </div>
 )
}

export function SeverityPill({
 severity,
 severityText,
}: {
 severity: AlertListItem["severity"]
 severityText?: boolean
}) {
 return (
  <span className={cn("inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-full font-semibold shrink-0", severityChipClass(severity))}>
   <span
    className={cn(
     "material-symbols-outlined text-[14px]",
     severity === "HIGH" ? "text-on-error-container" : severity === "MEDIUM" ? "text-on-secondary-fixed-variant" : "text-on-surface-variant",
    )}
   >
    {severity === "HIGH" ? "error" : severity === "MEDIUM" ? "warning" : "info"}
   </span>
   {severityText ? severityLabel(severity) : severity}
  </span>
 )
}
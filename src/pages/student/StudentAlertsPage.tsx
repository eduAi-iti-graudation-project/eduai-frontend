import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Badge } from "@/components/ui/badge"
import { MiniStat } from "@/components/admin/MiniStat"
import { cn } from "@/lib/utils"

const severityStyles: Record<string, string> = {
 HIGH: "bg-error-container text-on-error-container",
 MEDIUM: "bg-tertiary-container text-on-tertiary-container",
 LOW: "bg-primary-fixed/30 text-primary",
}

const typeLabels: Record<string, string> = {
 PERFORMANCE_DROP: "Performance drop",
 ACADEMIC_DISTRESS: "Academic distress",
 ATTENDANCE_WARNING: "Attendance warning",
 SUBMISSION_GAP: "Submission gap",
 ENGAGEMENT_DROP: "Engagement drop",
 HOMEWORK_HELP_REDIRECT: "Homework help requested",
}

export function StudentAlertsPage() {
 const [typeFilter, setTypeFilter] = useState<string | null>(null)

 const alerts = useQuery({
  queryKey: ["student", "alerts"],
  queryFn: () => api.getStudentAlerts(),
 })

 const types = useMemo(() => {
  const seen = new Set<string>()
  for (const a of alerts.data ?? []) {
   if (a.type && !seen.has(a.type)) seen.add(a.type)
  }
  return [...seen]
 }, [alerts.data])

 const filtered = useMemo(() => {
  if (!typeFilter) return alerts.data ?? []
  return (alerts.data ?? []).filter((a) => a.type === typeFilter)
 }, [alerts.data, typeFilter])

 if (alerts.isError) {
  return (
   <ErrorState
    message={alerts.error instanceof Error ? alerts.error.message : "Failed to load alerts"}
    onRetry={() => alerts.refetch()}
   />
  )
 }

 return (
  <div className="flex-1 p-xl w-full">
   <header className="mb-6 border-b border-border pb-3">
    <h2 className="font-headline-lg text-headline-lg text-primary">Alerts</h2>
    <p className="font-body-md text-body-md text-on-surface-variant">
     Academic updates for you
    </p>
   </header>

   {alerts.isLoading ? (
    <LoadingState />
   ) : !alerts.data || alerts.data.length === 0 ? (
    <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-lg">
     <EmptyState
      icon="notifications_active"
      title="No active alerts"
      description="When there's an academic update for you, it will appear here."
     />
    </div>
   ) : (
    <>
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <MiniStat icon="notifications_active" label="Total alerts" value={alerts.data.length} />
      <MiniStat
       icon="priority_high"
       label="High"
       value={(alerts.data ?? []).filter((a) => a.severity === "HIGH").length}
       tone={(alerts.data ?? []).some((a) => a.severity === "HIGH") ? "danger" : "default"}
      />
      <MiniStat
       icon="info"
       label="Medium"
       value={(alerts.data ?? []).filter((a) => a.severity === "MEDIUM").length}
       tone={(alerts.data ?? []).some((a) => a.severity === "MEDIUM") ? "warning" : "default"}
      />
      <MiniStat icon="check_circle" label="Low" value={(alerts.data ?? []).filter((a) => a.severity === "LOW").length} />
     </div>

     {types.length > 1 && (
      <div className="flex flex-wrap items-center gap-2 mb-4">
       <span className="font-label-sm text-label-sm text-on-surface-variant">Filter by type:</span>
       <button
        type="button"
        onClick={() => setTypeFilter(null)}
        className={cn(
         "px-3 py-1.5 rounded-lg font-label-md text-label-md border transition-colors",
         typeFilter === null
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high",
        )}
       >
        All
       </button>
       {types.map((t) => (
        <button
         key={t}
         type="button"
         onClick={() => setTypeFilter(typeFilter === t ? null : t)}
         className={cn(
          "px-3 py-1.5 rounded-lg font-label-md text-label-md border transition-colors",
          typeFilter === t
           ? "bg-primary text-primary-foreground border-primary"
           : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high",
        )}
        >
         {typeLabels[t] ?? t}
        </button>
       ))}
      </div>
     )}

     <div className="space-y-3">
      {filtered.map((alert) => (
       <div
        key={alert.id}
        className="rounded-lg bg-surface-container-lowest p-md border border-outline-variant"
       >
        <div className="flex items-start justify-between gap-4">
         <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
           <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            notifications_active
           </span>
           <p className="font-label-md text-label-md text-on-surface">
            {typeLabels[alert.type] ?? alert.type}
           </p>
           <Badge
            variant="outline"
            className={cn(
             "font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0",
             severityStyles[alert.severity ?? ""] ?? "bg-surface-container-high text-on-surface-variant",
            )}
           >
            {alert.severity ?? "INFO"}
           </Badge>
          </div>
          <p className="font-body-md text-body-md text-on-surface">{alert.reason}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
           {alert.className && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
             {alert.className}
            </span>
           )}
           {alert.teacherName && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
             Teacher: {alert.teacherName}
            </span>
           )}
           <span className="font-label-sm text-label-sm text-on-surface-variant">
            {new Date(alert.createdAt).toLocaleDateString(undefined, {
             month: "short",
             day: "numeric",
             year: "numeric",
            })}
           </span>
          </div>
         </div>
        </div>
       </div>
      ))}
     </div>
    </>
   )}
  </div>
 )
}
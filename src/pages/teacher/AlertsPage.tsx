import { useState, useMemo } from "react"
import { useAlerts } from "@/hooks/use-alerts"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingState } from "@/components/shared/LoadingState"
import { AlertCard } from "@/components/ui/AlertCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

const STATUS_META: Record<string, { label: string; icon: string }> = {
 NEW: { label: "New", icon: "notifications_active" },
 ACKNOWLEDGED: { label: "Acknowledged", icon: "visibility" },
 RESOLVED: { label: "Resolved", icon: "check_circle" },
}

const SEVERITY_META: Record<string, { label: string; icon: string; active: string; idle: string; iconClass: string }> = {
 HIGH: {
  label: "High priority",
  icon: "error",
  active: "border-error-container bg-error-container text-on-error-container",
  idle: "border-outline-variant bg-surface-container-lowest hover:border-error-container",
  iconClass: "text-on-error-container",
 },
 MEDIUM: {
  label: "Medium",
  icon: "warning",
  active: "border-primary bg-primary-container text-on-primary-container",
  idle: "border-outline-variant bg-surface-container-lowest hover:border-primary",
  iconClass: "text-on-primary-container",
 },
 LOW: {
  label: "Low",
  icon: "info",
  active: "border-outline bg-surface-container-high text-on-surface",
  idle: "border-outline-variant bg-surface-container-lowest hover:border-outline",
  iconClass: "text-on-surface",
 },
}

export function AlertsPage() {
 const [statusFilter, setStatusFilter] = useState<string>("")
 const [severityFilter, setSeverityFilter] = useState<string>("")
 const { alerts, isLoading, resolve } = useAlerts(statusFilter || undefined)

 const counts = useMemo(() => {
  const acc: Record<string, number> = { NEW: 0, ACKNOWLEDGED: 0, RESOLVED: 0 }
  for (const a of alerts) {
   if (acc[a.status] !== undefined) acc[a.status] += 1
  }
  return acc
 }, [alerts])

 const severityCounts = useMemo(() => {
  const acc: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const a of alerts) {
   if (acc[a.severity] !== undefined) acc[a.severity] += 1
  }
  return acc
 }, [alerts])

 const visibleAlerts = severityFilter ? alerts.filter((a) => a.severity === severityFilter) : alerts
 const hasFilter = statusFilter !== "" || severityFilter !== ""

 return (
  <div className="flex flex-col min-h-full">
   <PageHeader
    title="Alerts"
    subtitle="Student alerts that need your attention"
    actions={
     <Select
      value={statusFilter || "all"}
      onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
     >
      <SelectTrigger className="w-[180px] h-auto rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:ring-primary-container">
       <SelectValue placeholder="All alerts" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All alerts</SelectItem>
       <SelectItem value="NEW">New</SelectItem>
       <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
       <SelectItem value="RESOLVED">Resolved</SelectItem>
      </SelectContent>
     </Select>
    }
   />

   {!isLoading && alerts.length > 0 && (
    <div className="px-6 pb-4 space-y-4">
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
      {Object.entries(STATUS_META).map(([status, meta]) => (
       <button
        key={status}
        type="button"
        onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
        className={`text-left rounded-lg border p-md transition-colors ${
         statusFilter === status
          ? "border-primary bg-primary-container"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary"
        }`}
       >
        <div className="flex items-center gap-2 mb-2">
         <span className={`material-symbols-outlined text-[18px] ${statusFilter === status ? "text-on-primary-container" : "text-on-surface-variant"}`}>
          {meta.icon}
         </span>
         <span className={`font-label-md text-label-md ${statusFilter === status ? "text-on-primary-container" : "text-on-surface-variant"}`}>
          {meta.label}
         </span>
        </div>
        <p className="font-headline-lg text-headline-lg text-on-surface">{counts[status]}</p>
       </button>
      ))}
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
      {Object.entries(SEVERITY_META).map(([severity, meta]) => {
       const active = severityFilter === severity
       return (
        <button
         key={severity}
         type="button"
         onClick={() => setSeverityFilter(active ? "" : severity)}
         className={`text-left rounded-lg border p-md transition-colors ${active ? meta.active : meta.idle}`}
        >
         <div className="flex items-center gap-2 mb-2">
          <span className={`material-symbols-outlined text-[18px] ${active ? meta.iconClass : "text-on-surface-variant"}`}>
           {meta.icon}
          </span>
          <span className={`font-label-md text-label-md ${active ? meta.iconClass : "text-on-surface-variant"}`}>
           {meta.label}
          </span>
         </div>
         <p className="font-headline-lg text-headline-lg text-on-surface">{severityCounts[severity]}</p>
        </button>
       )
      })}
     </div>
    </div>
   )}

   <div className="flex-1 p-md">
    {isLoading ? (
     <LoadingState label="Loading alerts..." />
    ) : visibleAlerts.length === 0 ? (
     <div className="flex items-center justify-center h-full">
      <EmptyState
       icon="notifications"
       title={hasFilter ? "No matching alerts" : "All clear"}
       description={hasFilter ? "Try clearing the status or priority filters." : "No alerts to show right now."}
      />
     </div>
    ) : (
     <div className="space-y-3">
      {visibleAlerts.map((alert) => (
       <AlertCard
        key={alert.id}
        alert={alert}
        onResolve={alert.status !== "RESOLVED" ? () => resolve.mutate({ id: alert.id, status: "RESOLVED" }) : undefined}
       />
      ))}
     </div>
    )}
   </div>
  </div>
 )
}
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

export function AlertsPage() {
 const [statusFilter, setStatusFilter] = useState<string>("")
 const { alerts, isLoading, resolve } = useAlerts(statusFilter || undefined)

 const counts = useMemo(() => {
  const acc: Record<string, number> = { NEW: 0, ACKNOWLEDGED: 0, RESOLVED: 0 }
  for (const a of alerts) {
   if (acc[a.status] !== undefined) acc[a.status] += 1
  }
  return acc
 }, [alerts])

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
    <div className="px-6 pb-4">
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
    </div>
   )}

   <div className="flex-1 p-md">
    {isLoading ? (
     <LoadingState label="Loading alerts..." />
    ) : alerts.length === 0 ? (
     <div className="flex items-center justify-center h-full">
      <EmptyState icon="notifications" title="All clear" description="No alerts to show right now." />
     </div>
    ) : (
     <div className="space-y-3 max-w-4xl mx-auto">
      {alerts.map((alert) => (
       <AlertCard
        key={alert.id}
        type={alert.type}
        reason={alert.reason}
        status={alert.status}
        createdAt={alert.createdAt}
        onResolve={alert.status !== "RESOLVED" ? () => resolve.mutate({ id: alert.id, status: "RESOLVED" }) : undefined}
       />
      ))}
     </div>
    )}
   </div>
  </div>
 )
}

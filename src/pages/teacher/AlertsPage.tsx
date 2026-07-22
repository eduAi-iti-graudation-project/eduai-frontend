import { useState } from "react"
import { useAlerts } from "@/hooks/use-alerts"

export function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const { alerts, isLoading } = useAlerts(statusFilter || undefined)

  const typeIcons: Record<string, string> = {
    ATTENDANCE: "person_off",
    GRADE: "trending_down",
    BEHAVIOR: "warning",
    CONCERN: "heart_plus",
    MISSING_SUBMISSION: "assignment_late",
  }

  const statusColors: Record<string, string> = {
    NEW: "bg-red-100 text-red-800",
    ACKNOWLEDGED: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
  }

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <h1 className="font-headline-lg text-headline-lg text-primary">Alerts</h1>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
            <option value="">All alerts</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </header>

      <div className="flex-1 p-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="font-body-md text-body-md text-on-surface-variant">Loading alerts...</p>
          </div>
        ) : alerts.data?.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">notifications</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-2">All clear</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">No alerts to show right now.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {alerts.data?.map((alert) => (
              <div key={alert.id} className="tactile-card rounded-[24px] bg-surface-container-lowest p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.status === "NEW" ? "bg-red-100 text-red-600" : "bg-surface-container-low text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-[20px]">{typeIcons[alert.type] ?? "notifications_active"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${statusColors[alert.status] ?? "bg-gray-100 text-gray-800"}`}>{alert.status}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{alert.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">{alert.reason}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

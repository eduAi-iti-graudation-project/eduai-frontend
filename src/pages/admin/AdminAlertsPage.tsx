import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { DashboardStatCard } from "@/components/communication/DashboardStatCard"
import { EmptyState } from "@/components/ui/EmptyState"

export function AdminAlertsPage() {
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
  })

  const stats = useMemo(() => {
    const data = alerts.data ?? []
    const active = data.filter((a) => a.status === "ACTIVE" || a.status === "NEW")
    const resolved = data.filter((a) => a.status === "RESOLVED")
    return {
      total: data.length,
      active: active.length,
      resolved: resolved.length,
      high: active.filter((a) => a.severity === "HIGH").length,
      medium: active.filter((a) => a.severity === "MEDIUM").length,
      low: active.filter((a) => a.severity === "LOW").length,
      failing: active.filter((a) => a.type === "FAILING").length,
      downward: active.filter((a) => a.type === "DOWNWARD_TREND").length,
      byClass: Object.entries(
        active.reduce<Record<string, api.AlertListItem[]>>((acc, a) => {
          if (!acc[a.className]) acc[a.className] = []
          acc[a.className].push(a)
          return acc
        }, {}),
      ),
    }
  }, [alerts.data])

  if (alerts.isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Failed to load alerts</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {alerts.error instanceof Error ? alerts.error.message : "Something went wrong"}
          </p>
          <button onClick={() => alerts.refetch()} className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-6">School-Wide Overview</h1>

      {alerts.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
              <div className="h-4 w-16 bg-surface-container-high rounded-full mb-3" />
              <div className="h-6 w-12 bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <DashboardStatCard icon="notifications_active" label="Active Alerts" value={stats.active} color="text-error" />
            <DashboardStatCard icon="check_circle" label="Resolved This Week" value={stats.resolved} color="text-primary" />
            <DashboardStatCard icon="error" label="High Severity" value={stats.high} color="text-error" />
            <DashboardStatCard icon="warning" label="Medium Severity" value={stats.medium} color="text-yellow-600" />
            <DashboardStatCard icon="info" label="Low Severity" value={stats.low} color="text-blue-600" />
            <DashboardStatCard icon="trending_down" label="Failing Students" value={stats.failing} color="text-secondary" />
          </div>

          <div className="rounded-[32px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden mb-6">
            <div className="px-md py-3 border-b border-outline-variant/10 bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-primary">By Severity</h2>
            </div>
            <div className="p-md grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-error font-headline-lg text-headline-lg">{stats.high}</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">High</p>
              </div>
              <div>
                <span className="text-yellow-600 font-headline-lg text-headline-lg">{stats.medium}</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Medium</p>
              </div>
              <div>
                <span className="text-blue-600 font-headline-lg text-headline-lg">{stats.low}</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Low</p>
              </div>
            </div>
          </div>

          {stats.byClass.length === 0 ? (
            <EmptyState icon="notifications_off" title="All clear" description="No active alerts across any class." />
          ) : (
            <div className="space-y-4">
              <h2 className="font-headline-md text-headline-md text-primary">Class-Level Alerts</h2>
              {stats.byClass.map(([className, classAlerts]) => (
                <div key={className} className="rounded-[24px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden">
                  <div className="px-md py-3 border-b border-outline-variant/10 bg-surface-container-low">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-headline-md text-primary">{className}</h3>
                      <span className="bg-error-container text-error font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                        {classAlerts.length} flagged
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {classAlerts.map((a) => (
                      <Link
                        key={a.id}
                        to={`/alerts/${a.id}`}
                        className="flex items-center justify-between px-md py-3 hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={a.severity === "HIGH" ? "text-error" : a.severity === "MEDIUM" ? "text-yellow-600" : "text-blue-600"}>
                            {a.severity === "HIGH" ? "🔴" : a.severity === "MEDIUM" ? "🟡" : "🟢"}
                          </span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">{a.studentName}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">{a.type.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
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

export function GuardianAlertsPage() {
  const [childFilter, setChildFilter] = useState<string | null>(null)

  const alerts = useQuery({
    queryKey: ["guardian", "alerts"],
    queryFn: () => api.getGuardianAlerts(),
  })

  const children = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of alerts.data ?? []) {
      if (a.studentId && !map.has(a.studentId)) map.set(a.studentId, a.studentName)
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [alerts.data])

  const filtered = useMemo(() => {
    if (!childFilter) return alerts.data ?? []
    return (alerts.data ?? []).filter((a) => a.studentId === childFilter)
  }, [alerts.data, childFilter])

  const high = (alerts.data ?? []).filter((a) => a.severity === "HIGH").length
  const medium = (alerts.data ?? []).filter((a) => a.severity === "MEDIUM").length
  const low = (alerts.data ?? []).filter((a) => a.severity === "LOW").length

  if (alerts.isError) {
    return (
      <ErrorState
        message={alerts.error instanceof Error ? alerts.error.message : "Failed to load alerts"}
        onRetry={() => alerts.refetch()}
      />
    )
  }

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <header className="mb-6 border-b border-border pb-3">
        <h2 className="font-headline-lg text-headline-lg text-primary">Alerts</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Academic updates across your children
        </p>
      </header>

      {alerts.isLoading ? (
        <LoadingState />
      ) : !alerts.data || alerts.data.length === 0 ? (
        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-lg">
          <EmptyState
            icon="notifications_active"
            title="No active alerts"
            description="When there's an academic update for your children, it will appear here."
            action={
              <Link
                to="/guardian/assistant"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Ask the Assistant instead
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <MiniStat icon="notifications_active" label="Total alerts" value={alerts.data.length} />
            <MiniStat icon="notifications_active" label="High" value={high} tone={high ? "danger" : "default"} />
            <MiniStat icon="notifications_active" label="Medium" value={medium} tone={medium ? "warning" : "default"} />
            <MiniStat icon="notifications_active" label="Low" value={low} />
          </div>

          {children.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Filter by child:</span>
              <button
                type="button"
                onClick={() => setChildFilter(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-label-md text-label-md border transition-colors",
                  childFilter === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high",
                )}
              >
                All
              </button>
              {children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChildFilter(childFilter === c.id ? null : c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-label-md text-label-md border transition-colors",
                    childFilter === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((alert) => (
              <Link
                key={alert.id}
                to={`/guardian/alerts/${alert.id}`}
                className="block rounded-lg bg-surface-container-lowest p-md border border-outline-variant hover:border-primary-container/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                        family_history
                      </span>
                      <p className="font-label-md text-label-md text-on-surface">
                        {alert.studentName}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0", severityStyles[alert.severity ?? ""] ?? "bg-surface-container-high text-on-surface-variant")}
                      >
                        {alert.severity ?? "INFO"}
                      </Badge>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface truncate">
                      {alert.reason}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {new Date(alert.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
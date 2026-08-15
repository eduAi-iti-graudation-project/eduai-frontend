import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Badge } from "@/components/ui/badge"

const severityStyles: Record<string, string> = {
  HIGH: "bg-error-container text-on-error-container",
  MEDIUM: "bg-tertiary-container text-on-tertiary-container",
  LOW: "bg-primary-fixed/30 text-primary",
}

export function GuardianAlertsPage() {
  const alerts = useQuery({
    queryKey: ["guardian", "alerts"],
    queryFn: () => api.getGuardianAlerts(),
  })

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
        <EmptyState
          icon="notifications_active"
          title="No active alerts"
          description="When there's an academic update for your children, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {alerts.data.map((alert) => (
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
                  <Badge
                    variant="outline"
                    className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 ${
                      severityStyles[alert.severity ?? ""] ?? "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {alert.severity ?? "INFO"}
                  </Badge>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
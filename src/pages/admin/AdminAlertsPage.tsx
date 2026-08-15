import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { PrecisionStatCard } from "@/components/admin/PrecisionStatCard"
import { FriendlyAlert, SeverityPill } from "@/components/admin/AlertPresentation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

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
          const key = a.className || "Unassigned"
          if (!acc[key]) acc[key] = []
          acc[key].push(a)
          return acc
        }, {}),
      ),
    }
  }, [alerts.data])

  if (alerts.isError) {
    return (
      <ErrorState
        title="Failed to load alerts"
        message={alerts.error instanceof Error ? alerts.error.message : "Something went wrong"}
        onRetry={() => alerts.refetch()}
      />
    )
  }

  if (alerts.isLoading) {
    return <LoadingState label="Loading alerts…" />
  }

  return (
    <div className="flex-1 px-4 py-4 min-w-0">
      <div className="max-w-[1400px] mx-auto space-y-3 min-w-0">
        <PageHeader
          className="px-0 pt-0"
          title="Alerts"
          subtitle={`${stats.active} active · ${stats.resolved} resolved this term`}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <PrecisionStatCard
            icon="notifications_active"
            label="Active"
            value={stats.active}
            delta={{ label: stats.active ? "Needs action" : "Clear", direction: stats.active ? "up" : "flat", tone: stats.active ? "negative" : "positive" }}
            iconClass="bg-[#ffdad6] text-[#93000a]"
          />
          <PrecisionStatCard
            icon="error"
            label="High"
            value={stats.high}
            delta={{ label: "Priority", direction: stats.high ? "up" : "flat", tone: stats.high ? "negative" : "neutral" }}
            iconClass="bg-[#ffdad6] text-[#93000a]"
          />
          <PrecisionStatCard
            icon="warning"
            label="Medium"
            value={stats.medium}
            delta={{ label: "Monitor", direction: stats.medium ? "up" : "flat", tone: stats.medium ? "negative" : "neutral" }}
            iconClass="bg-[#fef3c7] text-[#78350f]"
          />
          <PrecisionStatCard
            icon="info"
            label="Low"
            value={stats.low}
            delta={{ label: "Track", direction: "flat", tone: "neutral" }}
            iconClass="bg-[#dde1fd] text-[#41465c]"
          />
          <PrecisionStatCard
            icon="check_circle"
            label="Resolved"
            value={stats.resolved}
            delta={{ label: "Cleared", direction: stats.resolved ? "down" : "flat", tone: "positive" }}
            iconClass="bg-[#dcfce7] text-[#14532d]"
          />
          <PrecisionStatCard
            icon="trending_down"
            label="Failing"
            value={stats.failing}
            delta={{ label: stats.downward ? `${stats.downward} declining` : "Stable", direction: stats.failing ? "up" : "flat", tone: stats.failing ? "negative" : "positive" }}
            iconClass="bg-[#dcfce7] text-[#14532d]"
          />
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low/60">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">By severity</h2>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="font-headline-lg text-headline-lg text-[#93000a]">{stats.high}</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">High</p>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg text-[#78350f]">{stats.medium}</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Medium</p>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg text-on-surface-variant">{stats.low}</span>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Low</p>
            </div>
          </div>
        </div>

        {stats.byClass.length === 0 ? (
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant">
            <EmptyState icon="notifications_off" title="All clear" description="No active alerts across any class." />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Class-level alerts</h2>
            {stats.byClass.map(([className, classAlerts]) => (
              <div key={className} className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-hidden">
                <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low/60">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">{className}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                        {classAlerts.length} student{classAlerts.length === 1 ? " is" : "s are"} currently flagged
                        {(() => {
                          const grade = classAlerts.find((a) => a.grade?.name)?.grade?.name
                          const teacher = classAlerts.find((a) => a.teacherName)?.teacherName
                          const parts: string[] = []
                          if (grade) parts.push(`grade ${grade}`)
                          if (teacher) parts.push(`taught by ${teacher}`)
                          return parts.length ? ` — in ${parts.join(", ")}` : ""
                        })()}
                      </p>
                    </div>
                    <span className="inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-medium shrink-0">
                      {classAlerts.length} flagged
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {classAlerts.map((a) => (
                    <Link
                      key={a.id}
                      to={`/admin/insights/students/${a.studentId}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors"
                    >
                      <Avatar className="h-8 w-8 rounded-full shrink-0">
                        <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
                          {initials(a.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{a.studentName}</p>
                        <div className="mt-1">
                          <FriendlyAlert alert={a} />
                        </div>
                      </div>
                      <SeverityPill severity={a.severity} severityText />
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">chevron_right</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
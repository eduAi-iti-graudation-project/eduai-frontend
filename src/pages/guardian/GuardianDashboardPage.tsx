import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { WelcomeBanner } from "@/components/shared/WelcomeBanner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDashboardInsights } from "@/hooks/use-dashboard-insights"
import { InsightSectionCard } from "@/components/insights/InsightSectionCard"

interface ChildSummary {
  id: string
  name: string
  className: string
  overallAverage: number
  attendanceRate: number
  activeAlertCount: number
  activeAlertId: string | null
}

interface GuardianDashboardOverview {
  children: ChildSummary[]
  unreadNotifications: number
}

const severityStyles: Record<string, string> = {
  HIGH: "bg-error-container text-on-error-container",
  MEDIUM: "bg-tertiary-container text-on-tertiary-container",
  LOW: "bg-primary-fixed/30 text-primary",
}

function Metric({ label, icon, value, caption, tone, to }: { label: string; icon: string; value: string | number; caption: string; tone?: string; to?: string }) {
  const iconClass = tone ?? "bg-primary-container text-primary"
  const card = (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary-container/40 transition-colors h-full">
      <div className="flex justify-between items-start">
        <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </span>
      </div>
      <div className="text-2xl md:text-3xl font-headline-lg font-bold tracking-tight text-on-surface">{value}</div>
      <div className="text-xs text-on-surface-variant font-medium mt-1">{caption}</div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{card}</Link> : card
}

const QUICK_LINKS = [
  { to: "/guardian/assistant", icon: "smart_toy", label: "Assistant", caption: "Ask about your child" },
  { to: "/guardian/insights", icon: "monitoring", label: "Insights", caption: "Progress trends" },
  { to: "/guardian/reports", icon: "description", label: "Reports", caption: "Academic reports" },
  { to: "/guardian/alerts", icon: "notifications_active", label: "Alerts", caption: "Academic updates" },
  { to: "/guardian/chat", icon: "chat_bubble", label: "Messages", caption: "Talk to the school" },
  { to: "/guardian/notifications", icon: "notifications", label: "Notifications", caption: "What's new" },
]

export function GuardianDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const dashboard = useQuery({
    queryKey: ["dashboard", "guardian"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as GuardianDashboardOverview
    },
  })

 const alerts = useQuery({
  queryKey: ["guardian", "alerts"],
  queryFn: () => api.getGuardianAlerts(),
 })

 const insights = useDashboardInsights("week")

 if (dashboard.isError) {
    return (
      <ErrorState
        message={dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
        onRetry={() => dashboard.refetch()}
      />
    )
  }

  const children = dashboard.data?.children ?? []
  const totalActiveAlerts = children.reduce((sum, c) => sum + c.activeAlertCount, 0)
  const avgOverall =
    children.length > 0
      ? Math.round(children.reduce((sum, c) => sum + c.overallAverage, 0) / children.length)
      : 0
  const recentAlerts = alerts.data ?? []
 const insightSections = insights.data?.sections ?? []

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
   <WelcomeBanner
    userName={user?.name ?? "Guardian"}
    roleLabel="Guardian"
    email={user?.email}
    className="mb-6"
    details={[
     { icon: "family_history", label: "Children", value: children.length > 0 ? String(children.length) : "—" },
     { icon: "trending_up", label: "Avg. score", value: avgOverall > 0 ? `${avgOverall}%` : "—" },
     { icon: "warning", label: "Active alerts", value: String(totalActiveAlerts) },
    ]}
   />

      {dashboard.isLoading ? (
        <LoadingState />
      ) : !dashboard.data || children.length === 0 ? (
        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-lg">
          <EmptyState
            icon="family_history"
            title="No children linked"
            description="When your children are linked to your account, their progress will appear here."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric
              label="Children"
              icon="family_history"
              value={children.length}
              caption={children.length === 1 ? "linked to your account" : "linked to your account"}
              to="/guardian/assistant"
            />
            <Metric
              label="Active alerts"
              icon="warning"
              value={totalActiveAlerts}
              caption={totalActiveAlerts === 0 ? "all clear" : "need your attention"}
              tone={totalActiveAlerts > 0 ? "bg-error-container text-error" : undefined}
              to="/guardian/alerts"
            />
            <Metric
              label="Avg overall"
              icon="grade"
              value={`${avgOverall}%`}
              caption="across your children"
              to="/guardian/insights"
            />
            <Metric
              label="Notifications"
              icon="notifications"
              value={dashboard.data.unreadNotifications}
              caption="waiting for you"
              to="/guardian/notifications"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                <h2 className="font-headline-md text-headline-md text-primary">Your children</h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/guardian/assistant")}
                  className="font-label-sm text-label-sm text-primary hover:bg-transparent h-auto px-2 py-1"
                >
                  Ask about them
                  <span className="material-symbols-outlined text-[16px] ml-1">smart_toy</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="rounded-xl bg-surface-container-lowest p-xl border border-outline-variant hover:border-primary-container/40 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4 w-full">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary">{child.name}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant">{child.className}</p>
                      </div>
                      {child.activeAlertCount > 0 && child.activeAlertId && (
                        <Badge
                          variant="outline"
                          className="bg-primary-container text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/guardian/alerts/${child.activeAlertId}`)
                          }}
                        >
                          {child.activeAlertCount} alert{child.activeAlertCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mb-4">
                      <div className="bg-surface-container-low rounded-xl p-md text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Average</p>
                        <p className="font-headline-md text-headline-md text-primary">{child.overallAverage}%</p>
                      </div>
                      <div className="bg-surface-container-low rounded-xl p-md text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Attendance</p>
                        <p className="font-headline-md text-headline-md text-primary">{child.attendanceRate}%</p>
                      </div>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-outline-variant pt-3">
                      <Link
                        to={`/guardian/children/${child.id}`}
                        className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        Detail
                      </Link>
                      <Link
                        to={`/guardian/insights/students/${child.id}`}
                        className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">monitoring</span>
                        Insights
                      </Link>
                      <Link
                        to={`/guardian/assistant?student=${child.id}`}
                        className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        Ask
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                    Recent alerts
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{recentAlerts.length}</span>
                  </h2>
                  {recentAlerts.length > 0 && (
                    <Link to="/guardian/alerts" className="font-label-sm text-label-sm text-primary hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                {recentAlerts.length === 0 ? (
                  <div className="py-4 text-center">
                    <span className="material-symbols-outlined text-[32px] text-primary block mb-1">check_circle</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">No active alerts. Everything looks good.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {recentAlerts.slice(0, 5).map((alert) => (
                      <li key={alert.id}>
                        <Link
                          to={`/guardian/alerts/${alert.id}`}
                          className="py-3 flex items-start gap-3 hover:bg-surface-container-high transition-colors rounded-lg px-1 -mx-1"
                        >
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0 mt-0.5">family_history</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-label-md text-label-md text-on-surface truncate">{alert.studentName}</p>
                              <Badge
                                variant="outline"
                                className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 shrink-0 ${severityStyles[alert.severity ?? ""] ?? "bg-surface-container-high text-on-surface-variant"}`}
                              >
                                {alert.severity ?? "INFO"}
                              </Badge>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{alert.reason}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                              {new Date(alert.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-sm">
                <h2 className="font-headline-md text-headline-md text-primary border-b border-border pb-2 mb-3">Quick links</h2>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_LINKS.map((q) => (
                    <Link
                      key={q.to}
                      to={q.to}
                      className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3 hover:border-primary-container/40 hover:shadow-md transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary shrink-0">{q.icon}</span>
                      <span className="min-w-0">
                        <span className="block font-label-md text-label-md text-on-surface">{q.label}</span>
                        <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">{q.caption}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {insightSections.length > 0 && (
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                <h2 className="font-headline-md text-headline-md text-primary">This week</h2>
                <Link to="/guardian/insights" className="font-label-sm text-label-sm text-primary hover:underline">
                  View all insights
                </Link>
              </div>
              <div className="stagger-enter grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightSections.slice(0, 4).map((section) => (
                  <InsightSectionCard key={section.key} section={section} interval="week" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
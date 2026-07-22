import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

interface ChildSummary {
  id: string
  name: string
  className: string
  overallAverage: number
  attendanceRate: number
  activeAlerts: number
}

interface GuardianDashboardOverview {
  children: ChildSummary[]
  unreadNotifications: number
}

export function GuardianDashboardPage() {
  const navigate = useNavigate()

  const dashboard = useQuery({
    queryKey: ["dashboard", "guardian"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as GuardianDashboardOverview
    },
  })

  if (dashboard.isError) {
    return (
      <div className="flex items-center justify-center h-full p-xl">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
          </p>
          <button onClick={() => dashboard.refetch()} className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="font-headline-xl text-headline-xl text-primary">Guardian Dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Stay updated on your children's progress</p>
      </header>

      {dashboard.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[32px] bg-white p-xl border border-outline-variant/10 animate-pulse">
              <div className="h-6 w-40 bg-surface-container-high rounded-full mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-surface-container-high rounded-full" />
                <div className="h-4 w-3/4 bg-surface-container-high rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !dashboard.data || dashboard.data.children.length === 0 ? (
        <EmptyState
          icon="family_history"
          title="No children linked"
          description="When your children are linked to your account, their progress will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard.data.children.map((child) => (
            <button
              key={child.id}
              onClick={() => navigate(`/guardian/children/${child.id}`)}
              className="w-full text-left rounded-[32px] bg-white p-xl border border-outline-variant/10 shadow-sm hover:border-primary-container/30 hover:shadow-md transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">{child.name}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">{child.className}</p>
                </div>
                {child.activeAlerts > 0 && (
                  <span className="bg-error-container text-error font-label-sm text-label-sm px-sm py-0.5 rounded-full">
                    {child.activeAlerts} alert{child.activeAlerts !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-xl p-md text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Average</p>
                  <p className="font-headline-md text-headline-md text-primary">{child.overallAverage}%</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-md text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Attendance</p>
                  <p className="font-headline-md text-headline-md text-primary">{child.attendanceRate}%</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

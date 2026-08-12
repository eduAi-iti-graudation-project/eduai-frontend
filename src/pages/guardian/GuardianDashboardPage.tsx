import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import * as api from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
      <ErrorState
        message={dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
        onRetry={() => dashboard.refetch()}
      />
    )
  }

  return (
    <div className="flex-1 p-xl max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="font-headline-xl text-headline-xl text-primary">Guardian Dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Stay updated on your children's progress</p>
      </header>

      {dashboard.isLoading ? (
        <LoadingState />
      ) : !dashboard.data || dashboard.data.children.length === 0 ? (
        <EmptyState
          icon="family_history"
          title="No children linked"
          description="When your children are linked to your account, their progress will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard.data.children.map((child) => (
            <Button
              key={child.id}
              type="button"
              variant="ghost"
              onClick={() => navigate(`/guardian/children/${child.id}`)}
              className="w-full h-auto flex flex-col items-start justify-start gap-0 rounded-lg bg-white p-xl border border-border hover:border-primary-container/30 hover:shadow-md hover:scale-[1.02] transition-all hover:bg-white"
            >
              <div className="flex items-start justify-between mb-4 w-full">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">{child.name}</h2>
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
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-surface-container-low rounded-lg p-md text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Average</p>
                  <p className="font-headline-md text-headline-md text-primary">{child.overallAverage}%</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-md text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Attendance</p>
                  <p className="font-headline-md text-headline-md text-primary">{child.attendanceRate}%</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

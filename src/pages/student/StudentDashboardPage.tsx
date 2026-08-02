import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"

interface StudentDashboardOverview {
  upcomingCount: number
  attendancePercentage: number
  unreadNotifications: number
  recentGrades: { assignmentName: string; score: number; totalPoints: number; percentage: number }[]
}

export function StudentDashboardPage() {
  const { user } = useAuth()

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const dashboard = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as StudentDashboardOverview
    },
  })

  if (dashboard.isError) {
    return (
      <div className="flex items-center justify-center h-full p-margin-desktop">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
          </p>
          <button
            onClick={() => dashboard.refetch()}
            className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (studentClasses.data && studentClasses.data.length === 0) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Dashboard</h1>
        <EmptyState
          icon="school"
          title="Not enrolled in any classes"
          description="Browse available classes for your grade level and request to join."
          action={<Link to="/student/classes" className="bg-secondary-container text-white px-md py-sm rounded-full font-label-md inline-block">Browse Classes</Link>}
        />
      </div>
    )
  }

  const data = dashboard.data

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-4">Dashboard</h1>
        {dashboard.isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-[32px] bg-white p-md border border-outline-variant/10 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high mb-4" />
                  <div className="h-4 w-20 bg-surface-container-high rounded-full mb-2" />
                  <div className="h-6 w-16 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
            <div className="h-64 rounded-[32px] bg-white border border-outline-variant/10 animate-pulse" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">pending_actions</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Upcoming</p>
                <p className="font-headline-xl text-headline-xl text-primary mt-1">{data.upcomingCount}</p>
              </div>
              <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Attendance</p>
                <p className="font-headline-xl text-headline-xl text-primary mt-1">{data.attendancePercentage}%</p>
              </div>
              <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary">notifications</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Unread</p>
                <p className="font-headline-xl text-headline-xl text-primary mt-1">{data.unreadNotifications}</p>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm">
              <h2 className="font-headline-md text-headline-md text-primary mb-4">Recent Grades</h2>
              {data.recentGrades.length === 0 ? (
                <EmptyState
                  icon="grade"
                  title="No grades yet"
                  description="Your grades will appear here once assignments are graded."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="text-left font-label-sm text-label-sm text-on-surface-variant pb-3">Assignment</th>
                        <th className="text-right font-label-sm text-label-sm text-on-surface-variant pb-3">Score</th>
                        <th className="text-right font-label-sm text-label-sm text-on-surface-variant pb-3">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentGrades.map((g, i) => (
                        <tr key={i} className="border-b border-outline-variant/10 last:border-0">
                          <td className="py-3 font-body-md text-body-md text-on-surface">{g.assignmentName}</td>
                          <td className="py-3 text-right font-body-md text-body-md text-on-surface">{g.score}/{g.totalPoints}</td>
                          <td className="py-3 text-right">
                            <span className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-full">
                              {g.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
  )
}

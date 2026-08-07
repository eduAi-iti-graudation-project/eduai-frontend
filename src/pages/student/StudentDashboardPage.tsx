import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { EmptyState } from "@/components/ui/EmptyState"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { StatCard } from "@/components/shared/StatCard"

interface StudentDashboardOverview {
  grade: { id: string; level: number; name: string } | null
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

  const studentGrade = dashboard.data?.grade

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
        onRetry={() => dashboard.refetch()}
      />
    )
  }

  if (studentClasses.data && studentClasses.data.length === 0) {
    return (
      <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
          {studentGrade && (
            <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0">
              Grade {studentGrade.level}
            </Badge>
          )}
        </div>
        <EmptyState
          icon="school"
          title="Not enrolled in any classes"
          description="Browse available classes for your grade level and request to join."
          action={<Link to="/student/classes" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md inline-block">Browse Classes</Link>}
        />
      </div>
    )
  }

  const data = dashboard.data

  return (
    <div className="flex-1 p-margin-desktop max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
          {studentGrade && (
            <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0">
              Grade {studentGrade.level}
            </Badge>
          )}
        </div>
        {dashboard.isLoading ? (
          <LoadingState />
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard icon="pending_actions" label="Upcoming" value={data.upcomingCount} />
              <StatCard icon="check_circle" label="Attendance" value={`${data.attendancePercentage}%`} />
              <StatCard icon="notifications" label="Unread" value={data.unreadNotifications} />
            </div>

            <div className="rounded-lg bg-white p-md border border-border">
              <h2 className="font-headline-md text-headline-md text-primary mb-4">Recent Grades</h2>
              {data.recentGrades.length === 0 ? (
                <EmptyState
                  icon="grade"
                  title="No grades yet"
                  description="Your grades will appear here once assignments are graded."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant pb-3 px-0 h-auto">Assignment</TableHead>
                      <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant pb-3 px-0 h-auto">Score</TableHead>
                      <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant pb-3 px-0 h-auto">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentGrades.map((g, i) => (
                      <TableRow key={i} className="border-b border-border hover:bg-transparent">
                        <TableCell className="py-3 px-0 font-body-md text-body-md text-on-surface">{g.assignmentName}</TableCell>
                        <TableCell className="py-3 px-0 text-right font-body-md text-body-md text-on-surface">{g.score}/{g.totalPoints}</TableCell>
                        <TableCell className="py-3 px-0 text-right">
                          <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0">
                            {g.percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : null}
      </div>
  )
}

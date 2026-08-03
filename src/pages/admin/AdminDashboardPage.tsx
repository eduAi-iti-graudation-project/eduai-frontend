import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import * as api from "@/lib/api"
import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface AdminDashboardOverview {
  teacherCount: number
  studentCount: number
  classCount: number
  flaggedStudentCount: number
  averagePassRate: number
  pendingReportCount: number
  activeAlertCount: number
  resolvedAlertCount: number
  teachers: { id: string; name: string; classAverage: number; studentCount: number }[]
}

export function AdminDashboardPage() {
  const dashboard = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as AdminDashboardOverview
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

  if (dashboard.isLoading) {
    return <LoadingState />
  }

  const data = dashboard.data

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon="school" label="Teachers" value={data?.teacherCount ?? 0} />
        <StatCard icon="group" label="Students" value={data?.studentCount ?? 0} />
        <StatCard icon="meeting_room" label="Classes" value={data?.classCount ?? 0} />
        <StatCard icon="notifications_active" label="Active Alerts" value={data?.activeAlertCount ?? 0} color="text-error" />
        <StatCard icon="trending_up" label="Avg Pass Rate" value={data ? `${data.averagePassRate}%` : "—"} />
        <StatCard icon="description" label="Pending Reports" value={data?.pendingReportCount ?? 0} color="text-secondary" />
      </div>

      {data && data.activeAlertCount > 0 && (
        <div className="rounded-[32px] bg-white border border-outline-variant/10 shadow-sm p-md mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-error">notifications_active</span>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">{data.activeAlertCount} Active Alerts</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{data.resolvedAlertCount} resolved this week</p>
            </div>
          </div>
          <Button asChild variant="default" className="rounded-full px-md py-sm h-auto font-label-md text-label-sm text-white hover:opacity-90 hover:bg-primary">
            <Link to="/admin/alerts">View All Alerts</Link>
          </Button>
        </div>
      )}

      {data && data.teachers.length > 0 && (
        <div className="rounded-[32px] bg-white border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="px-md py-4 border-b border-outline-variant/10">
            <h2 className="font-headline-md text-headline-md text-primary">Teachers</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-outline-variant/10 bg-surface-container-low hover:bg-transparent">
                <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Name</TableHead>
                <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Class Average</TableHead>
                <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-md py-3 h-auto">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teachers.map((t) => (
                <TableRow key={t.id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors cursor-pointer">
                  <TableCell className="px-md py-3 font-body-md text-body-md text-on-surface">{t.name}</TableCell>
                  <TableCell className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{t.classAverage}%</TableCell>
                  <TableCell className="px-md py-3 text-right font-body-md text-body-md text-on-surface">{t.studentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

import { useMemo, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { AttendanceHeatmap } from "@/components/attendance/AttendanceHeatmap"
import { AttendanceDonut, MonthlyAttendanceBars } from "@/components/attendance/AttendanceCharts"
import { computeAttendanceStats } from "@/lib/attendance-stats"
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

const statusStyles: Record<string, string> = {
  PRESENT: "bg-primary-fixed/40 text-primary",
  ABSENT: "bg-error-container text-on-error-container",
  LATE: "bg-surface-container-high text-on-surface",
  EXCUSED: "bg-surface-container-high text-on-surface-variant",
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
  delay,
}: {
  icon: string
  iconBg: string
  iconColor: string
  value: string
  label: string
  sub?: string
  delay: number
}) {
  return (
    <div
      className="bg-white rounded-[28px] border border-border p-md flex items-center gap-md animate-[rise-in_500ms_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center ${iconBg}`}>
        <span className={`material-symbols-outlined text-[24px] ${iconColor}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-headline-lg text-headline-lg text-on-surface leading-tight">{value}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{label}</p>
        {sub && <p className="font-label-sm text-label-sm text-primary truncate">{sub}</p>}
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-border p-xl">
      <div className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
        {subtitle && <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function MyAttendancePage() {
  const { user } = useAuth()

  const { data: records, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["student-attendance", user?.id],
    queryFn: () => api.getStudentAttendance(user!.id),
    enabled: !!user?.id,
  })

  const stats = useMemo(() => computeAttendanceStats(records ?? []), [records])

  if (isError) {
    return (
      <ErrorState
        title="Failed to load attendance"
        message={error instanceof Error ? error.message : "Something went wrong"}
        onRetry={() => refetch()}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-6xl mx-auto w-full">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="flex-1 p-margin-desktop max-w-6xl mx-auto w-full space-y-lg">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">My Attendance</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Every square is a school day — green means you showed up.
          </p>
        </div>
        {stats.currentStreak > 1 && (
          <div className="inline-flex items-center gap-2 bg-secondary-container/10 text-secondary px-md py-sm rounded-lg border border-secondary/20 animate-[rise-in_500ms_ease-out_both]">
            <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
            <span className="font-label-md text-label-md">
              {stats.currentStreak}-day streak — keep it going!
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          icon="donut_small"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          value={`${stats.presentPercent}%`}
          label="Attendance rate"
          sub={`${stats.totalDays} school days logged`}
          delay={0}
        />
        <StatCard
          icon="check_circle"
          iconBg="bg-primary-fixed/40"
          iconColor="text-primary"
          value={String(stats.presentDays)}
          label="Days present"
          delay={60}
        />
        <StatCard
          icon="local_fire_department"
          iconBg="bg-secondary-container/10"
          iconColor="text-secondary"
          value={String(stats.currentStreak)}
          label="Current streak"
          sub={stats.currentStreak > 0 ? "in days" : "start tomorrow!"}
          delay={120}
        />
        <StatCard
          icon="emoji_events"
          iconBg="bg-accent"
          iconColor="text-accent-foreground"
          value={String(stats.bestStreak)}
          label="Best streak"
          sub="in days"
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
        <div className="xl:col-span-2 animate-[rise-in_550ms_ease-out_both]" style={{ animationDelay: "120ms" }}>
          <Card title="Activity" subtitle="Your last 26 weeks, one square per day">
            <AttendanceHeatmap records={records ?? []} />
          </Card>
        </div>
        <div className="animate-[rise-in_550ms_ease-out_both]" style={{ animationDelay: "180ms" }}>
          <Card title="Breakdown" subtitle="How your days were logged">
            <AttendanceDonut records={records ?? []} />
          </Card>
        </div>
      </div>

      <div className="animate-[rise-in_550ms_ease-out_both]" style={{ animationDelay: "240ms" }}>
        <Card title="Last 6 months" subtitle="Days per month, stacked by status">
          <MonthlyAttendanceBars records={records ?? []} />
        </Card>
      </div>

      <div className="animate-[rise-in_550ms_ease-out_both]" style={{ animationDelay: "300ms" }}>
        <Card title="Recent records">
          <div className="-mx-xl -mb-xl overflow-hidden rounded-b-[32px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-surface-container-low hover:bg-surface-container-low">
                  <TableHead className="text-left font-label-sm text-label-sm text-on-surface-variant px-xl py-3 h-auto">Date</TableHead>
                  <TableHead className="text-right font-label-sm text-label-sm text-on-surface-variant px-xl py-3 h-auto">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records === undefined || records.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="px-xl py-6 text-center font-body-md text-body-md text-on-surface-variant">
                      No records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-b border-border hover:bg-surface-container transition-colors"
                    >
                      <TableCell className="px-xl py-3 font-body-md text-body-md text-on-surface">
                        {new Date(r.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="px-xl py-3 text-right">
                        <Badge
                          variant="outline"
                          className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 ${
                            statusStyles[r.status] ?? "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}

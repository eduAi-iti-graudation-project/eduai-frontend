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

interface StudentDashboardData {
  upcomingAssignments: { title: string; dueDate: string; className: string }[]
  recentGrades: { assignmentTitle: string; score: number; totalPoints: number; percentage: number }[]
  attendanceRate: number
  activeAlerts: { id: string; type: string; reason: string }[]
  unreadNotifications: number
  grade: { id: string; level: number; name: string } | null
}

function formatDueDate(dueDate: string): { label: string; tone: "overdue" | "urgent" | "normal" } {
  const due = new Date(dueDate).getTime()
  const now = Date.now()
  const hours = Math.round((due - now) / (1000 * 60 * 60))
  if (hours < 0) return { label: "Overdue", tone: "overdue" }
  if (hours < 48) return { label: hours < 24 ? `Due in ${hours}h` : `Due in ${Math.round(hours / 24)}d`, tone: "urgent" }
  return { label: `Due in ${Math.round(hours / 24)}d`, tone: "normal" }
}

function formatMeetingDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  return `${date} · ${time}`
}

function Metric({ label, icon, value, caption, to, tone }: { label: string; icon: string; value: string | number; caption: string; to?: string; tone?: string }) {
  const iconClass = tone ?? "bg-primary-container text-primary"
  const card = (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-md flex flex-col gap-2 hover:border-primary-container/40 transition-colors h-full">
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
  { to: "/student/classes", icon: "school", label: "My Sections", caption: "Assignments & materials" },
  { to: "/student/grades", icon: "grade", label: "Grades", caption: "Scores & feedback" },
  { to: "/student/attendance", icon: "event_available", label: "Attendance", caption: "Sessions attended" },
  { to: "/student/timetable", icon: "calendar_month", label: "Timetable", caption: "Weekly schedule" },
  { to: "/student/quizzes", icon: "quiz", label: "Quizzes", caption: "Practice & tests" },
  { to: "/student/study-lab", icon: "science", label: "Study Lab", caption: "AI-powered practice" },
  { to: "/student/homework-help", icon: "help", label: "Homework Help", caption: "AI tutoring" },
  { to: "/student/meetings", icon: "video_call", label: "Meetings", caption: "Live classes" },
]

export function StudentDashboardPage() {
  const { user } = useAuth()

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

  const dashboard = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.getDashboard()) as unknown as StudentDashboardData,
  })

  const meetingsQuery = useQuery({
    queryKey: ["meetings", "student", "upcoming"],
    queryFn: () => api.listMeetings("upcoming"),
    staleTime: 60_000,
    retry: 1,
  })

  const data = dashboard.data
  const studentGrade = data?.grade
  const firstName = user?.name?.split(" ")[0]
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

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
      <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
          {studentGrade && (
            <Badge variant="outline" className="bg-primary-fixed/30 text-primary font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0">
              {studentGrade.name}
            </Badge>
          )}
        </div>
        <EmptyState
          icon="school"
          title="Not enrolled in any courses"
          description="Browse available courses for your grade level and request to join."
          action={<Link to="/student/classes" className="bg-primary text-primary-foreground px-md py-sm rounded-lg font-label-md inline-block">Browse Courses</Link>}
        />
      </div>
    )
  }

  if (dashboard.isLoading) {
    return (
      <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
        <LoadingState label="Loading your dashboard..." />
      </div>
    )
  }

  const upcoming = data?.upcomingAssignments ?? []
  const recentGrades = data?.recentGrades ?? []
  const activeAlerts = data?.activeAlerts ?? []
  const attendanceRate = Math.round((data?.attendanceRate ?? 0) * 100)
  const upcomingMeetings = meetingsQuery.data?.meetings ?? []

  return (
    <div className="flex-1 p-margin-desktop max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {firstName ? `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${firstName}` : "Dashboard"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{today}</p>
        </div>
        {studentGrade && (
          <Badge variant="outline" className="bg-primary text-primary-foreground font-label-md text-label-md font-semibold px-md py-1.5 rounded-lg border-0 shadow-sm">
            {studentGrade.name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric
          label="Upcoming deadlines"
          icon="pending_actions"
          value={upcoming.length}
          caption="assignments due soon"
          to="/student/assignments"
        />
        <Metric
          label="Attendance"
          icon="check_circle"
          value={`${attendanceRate}%`}
          caption="of scheduled sessions"
          to="/student/attendance"
          tone={attendanceRate >= 75 ? undefined : "bg-error-container text-error"}
        />
        <Metric
          label="Active alerts"
          icon="warning"
          value={activeAlerts.length}
          caption={activeAlerts.length === 0 ? "all clear" : "need your attention"}
          to="/student/attendance"
          tone={activeAlerts.length > 0 ? "bg-error-container text-error" : undefined}
        />
        <Metric
          label="Unread notifications"
          icon="notifications"
          value={data?.unreadNotifications ?? 0}
          caption="waiting for you"
          to="/student/notifications"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming deadlines</h2>
            <Link to="/student/assignments" className="font-label-sm text-label-sm text-primary hover:underline">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon="task_alt" title="Nothing due" description="You're all caught up — enjoy the breather." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 5).map((a, i) => {
                const due = formatDueDate(a.dueDate)
                return (
                  <li key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">{a.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{a.className}</p>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border shrink-0 ${
                        due.tone === "overdue"
                          ? "bg-error-container text-on-error-container border-error-container"
                          : due.tone === "urgent"
                            ? "bg-tertiary-container text-on-tertiary-container border-tertiary-container"
                            : "bg-surface-variant text-on-surface-variant border-outline-variant"
                      }`}
                    >
                      {due.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming meetings</h2>
            <Link to="/student/meetings" className="font-label-sm text-label-sm text-primary hover:underline">View all</Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <EmptyState icon="video_call" title="No upcoming meetings" description="When a teacher schedules a live class, it shows up here." />
          ) : (
            <ul className="divide-y divide-border">
              {upcomingMeetings.slice(0, 3).map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{m.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {m.sectionName ?? m.courseName ?? "Live class"}
                    </p>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                    {formatMeetingDate(m.scheduledStart)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-md mb-6">
        <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Recent grades</h2>
          <Link to="/student/grades" className="font-label-sm text-label-sm text-primary hover:underline">View all</Link>
        </div>
        {recentGrades.length === 0 ? (
          <EmptyState icon="grade" title="No grades yet" description="Your grades will appear here once assignments are graded." />
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
              {recentGrades.map((g, i) => (
                <TableRow key={i} className="border-b border-border hover:bg-transparent">
                  <TableCell className="py-3 px-0 font-body-md text-body-md text-on-surface">{g.assignmentTitle}</TableCell>
                  <TableCell className="py-3 px-0 text-right font-body-md text-body-md text-on-surface">{g.score}/{g.totalPoints}</TableCell>
                  <TableCell className="py-3 px-0 text-right">
                    <Badge
                      variant="outline"
                      className={`font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 ${
                        g.percentage >= 70
                          ? "bg-primary-fixed/30 text-primary"
                          : "bg-error-container/50 text-on-error-container"
                      }`}
                    >
                      {g.percentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {activeAlerts.length > 0 && (
        <div className="rounded-lg bg-error-container/40 border border-error-container p-md mb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-error">warning</span>
            Active alerts
          </h2>
          <ul className="space-y-2">
            {activeAlerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <Badge variant="outline" className="bg-error-container text-on-error-container font-label-sm text-label-sm px-sm py-0.5 rounded-lg border-0 shrink-0">
                  {a.type.replaceAll("_", " ")}
                </Badge>
                <span className="font-body-md text-body-md text-on-surface">{a.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-md shadow-md">
        <h2 className="font-headline-md text-headline-md text-on-surface border-b border-border pb-2 mb-4">Quick links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 hover:border-primary-container/40 hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[22px] text-primary shrink-0">{q.icon}</span>
              <span className="min-w-0">
                <span className="block font-label-md text-label-md text-on-surface">{q.label}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant truncate">{q.caption}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
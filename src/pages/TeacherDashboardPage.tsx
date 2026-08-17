import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useDashboardInsights } from "@/hooks/use-dashboard-insights"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { WelcomeBanner } from "@/components/shared/WelcomeBanner"
import { FriendlyAlert } from "@/components/admin/AlertPresentation"
import { InsightSectionCard } from "@/components/insights/InsightSectionCard"
import type { AlertListItem as Alert } from "@/lib/api"

function getInitials(name: string): string {
 return name
  .split(" ")
  .map((w) => w[0])
  .join("")
  .toUpperCase()
  .slice(0, 2)
}

const SEVERITY_STYLES: Record<string, { badge: string; label: string }> = {
 HIGH: { badge: "bg-error-container text-on-error-container border border-error-container", label: "High" },
 MEDIUM: { badge: "bg-surface-container-high text-on-surface border border-surface-container-high", label: "Med" },
 LOW: { badge: "bg-surface-variant text-on-surface-variant ", label: "Low" },
}

function AlertAvatar({ alert }: { alert: Alert }) {
 const initials = getInitials(alert.studentName ?? "Student")
 return (
  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-medium text-on-surface-variant shrink-0">
   {initials}
  </div>
 )
}

function StatCard({ label, icon, iconClass, value, caption }: { label: string; icon: string; iconClass: string; value: string | number; caption: string }) {
 return (
  <div className="nudge-hover bg-surface-container-lowest rounded-lg p-4 shadow-card flex flex-col gap-2">
   <div className="flex justify-between items-start">
    <span className="font-body-md text-body-md text-on-surface-variant">{label}</span>
    <span className={`material-symbols-outlined ${iconClass}`} style={{ fontSize: 20 }}>{icon}</span>
   </div>
   <div className="text-2xl md:text-3xl font-headline-lg font-bold tracking-tight text-on-surface">{value}</div>
   <div className="text-label-sm text-on-surface-variant font-medium mt-1">{caption}</div>
  </div>
 )
}

export function TeacherDashboardPage() {
 const { user } = useAuth()
 const { isLoading, isError, error, classCards, submissionRate, avgGrade, totalSubmissions, alerts, confirmedSubmissions } = useDashboardData()
 const insights = useDashboardInsights("week")

 const gradesQuery = useQuery({
  queryKey: ["teacher", "grades", "banner", user?.id],
  queryFn: () => api.getTeacherGrades(user!.id),
  enabled: !!user?.id,
 })
 const teacherGrades = gradesQuery.data ?? []
 const totalSections = teacherGrades.reduce((s, g) => s + g.sections, 0)
 const totalStudents = teacherGrades.reduce((s, g) => s + g.students, 0)
 const totalCourses = teacherGrades.reduce((s, g) => s + g.courses, 0)

 if (isError) {
  return <ErrorState message={error} onRetry={() => window.location.reload()} className="p-margin-desktop" />
  }

 if (isLoading) {
  return <LoadingState label="Loading dashboard..." />
 }

 const activeAlertCount = alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED").length
 const resolvedAlertCount = alerts.filter((a) => a.status === "RESOLVED").length
 const pendingCount = totalSubmissions - confirmedSubmissions

 const avgGradeDisplay =
  avgGrade > 0
   ? avgGrade >= 90 ? "A" : avgGrade >= 80 ? "B+" : avgGrade >= 70 ? "B-" : avgGrade >= 60 ? "C" : "D"
   : "—"

 const stats = [
  { label: "Active Alerts", icon: "warning", iconClass: "text-primary", value: activeAlertCount, caption: "Needs your attention" },
  { label: "Resolved", icon: "check_circle", iconClass: "text-success", value: resolvedAlertCount, caption: "All good" },
  { label: "Pending Review", icon: "pending_actions", iconClass: "text-primary", value: pendingCount, caption: "Awaiting your review" },
  { label: "Avg Section Score", icon: "analytics", iconClass: "text-primary", value: totalSubmissions > 0 ? `${submissionRate}%` : avgGradeDisplay, caption: "Submission rate" },
 ]

 return (
  <div className="min-h-full bg-surface">
   <div className="mx-auto flex max-w-[1600px] flex-col gap-md p-gutter pb-24 md:pb-0">
    <WelcomeBanner
     userName={user?.name ?? "Teacher"}
     roleLabel="Teacher"
     email={user?.email}
     details={[
      { icon: "workspaces", label: "Grades", value: teacherGrades.length > 0 ? String(teacherGrades.length) : "—" },
      { icon: "school", label: "Sections", value: totalSections > 0 ? String(totalSections) : "—" },
      { icon: "menu_book", label: "Courses", value: totalCourses > 0 ? String(totalCourses) : "—" },
      { icon: "groups", label: "Students", value: totalStudents > 0 ? String(totalStudents) : "—" },
     ]}
    />
    {/* Page Header */}
    <div className="flex justify-between items-end">
     <div>
      <h2 className="text-2xl md:text-3xl font-headline-lg font-bold tracking-tight text-primary mb-1">Overview</h2>
      <p className="font-body-md text-body-md text-on-surface-variant">Here&apos;s what&apos;s happening in your classes today.</p>
     </div>
    </div>

    {/* Stat Cards */}
    <div className="stagger-enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {stats.map((stat) => (
      <StatCard key={stat.label} {...stat} />
     ))}
    </div>

    {/* Bento Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
     {/* Main: Active Sections */}
     <div className="lg:col-span-2 flex flex-col gap-4">
      <div className="flex justify-between items-center">
       <h3 className="font-headline-md text-headline-md font-semibold text-primary">Active Sections</h3>
       {classCards.length > 0 && (
        <Link to="/classes" className="text-sm font-medium text-primary hover:underline cursor-pointer">View All</Link>
       )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-xl">
       {classCards.length === 0 && (
        <div className="col-span-full bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg p-md flex flex-col items-center justify-center text-center shadow-card">
         <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center text-outline mb-sm">
          <span className="material-symbols-outlined">school</span>
         </div>
         <h4 className="font-headline-md text-headline-md text-on-surface-variant mb-sm">No sections yet</h4>
         <p className="text-on-surface-variant text-sm max-w-[200px]">Create your first section to get started with grading</p>
        </div>
       )}
       {classCards.map((c) => (
        <Link
         key={c.id}
         to={`/classes/${c.id}`}
         className="group bg-surface-container-lowest rounded-lg p-4 shadow-card flex flex-col gap-4 hover:border-primary transition-colors cursor-pointer"
        >
         <div className="flex justify-between items-start">
          <div>
           <div className="text-label-sm text-outline tracking-[0.02em] uppercase mb-1">Section</div>
           <h4 className="text-headline-md font-headline-md text-primary group-hover:text-primary transition-colors">{c.name}</h4>
          </div>
          {c.pending > 0 ? (
           <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-label-sm font-medium border border-primary">
            {c.pending} Pending
           </span>
          ) : (
           <span className="bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded text-label-sm font-medium border border-border">
            All Clear
           </span>
          )}
         </div>
         <div className="flex -space-x-2 overflow-hidden mt-2">
          {Array.from({ length: Math.min(c.students, 3) }).map((_, j) => (
           <div
            key={j}
            className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-container-lowest bg-surface-variant flex items-center justify-center text-[10px] font-medium text-on-surface-variant"
           >
            {getInitials(`${c.name}${j + 1}`)}
           </div>
          ))}
          {c.students > 3 && (
           <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-container-lowest bg-surface-variant flex items-center justify-center text-[10px] font-medium text-on-surface-variant">
            +{c.students - 3}
           </div>
          )}
         </div>
         <div className="mt-auto pt-4 border-t border-surface-variant flex justify-between items-center">
          <span className="text-label-sm text-on-surface-variant">{c.section}</span>
          <span className="text-sm font-medium text-primary group-hover:text-primary-container flex items-center gap-1">
           Open Section
           <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </span>
         </div>
        </Link>
       ))}
      </div>
     </div>

     {/* Sidebar: Needs Attention */}
     <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
       <h3 className="text-headline-md font-headline-md font-semibold text-primary flex items-center gap-2">
        Needs Attention
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-label-sm font-medium">{activeAlertCount}</span>
       </h3>
      </div>

      <div className="bg-surface-container-lowest rounded-lg shadow-card overflow-hidden divide-y divide-surface-variant">
       {alerts.length === 0 && (
        <div className="p-6 text-center">
         <span className="material-symbols-outlined text-[32px] text-primary mb-sm block">check_circle</span>
         <p className="text-body-md font-body-md text-on-surface-variant">No alerts. Everything looks good.</p>
        </div>
       )}
       {alerts.map((alert) => {
        const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.LOW
        return (
         <Link
          key={alert.id}
          to={`/alerts/${alert.id}`}
          className="p-4 hover:bg-surface-container-high transition-colors flex items-start gap-3 cursor-pointer"
         >
          <AlertAvatar alert={alert} />
          <div className="flex-1 min-w-0">
           <div className="flex justify-between items-start mb-1">
           <p className="text-sm font-medium text-on-surface truncate">{alert.studentName ?? "Student"}</p>
           <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${sev.badge}`}>{sev.label}</span>
          </div>
          <FriendlyAlert alert={alert} />
         </div>
         </Link>
        )
       })}
      </div>

      {alerts.length > 0 && (
       <Link
        to="/alerts"
        className="w-full py-3 text-sm font-medium text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 rounded-lg bg-surface-container-lowest cursor-pointer shadow-card"
       >
        View all alerts ({alerts.length})
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
       </Link>
      )}
     </div>
    </div>

    {/* This week */}
    {insights.data && insights.data.sections.length > 0 && (
     <div className="flex flex-col gap-md">
      <div className="flex justify-between items-end">
       <h3 className="font-headline-md text-headline-md font-semibold text-primary">This week</h3>
       <Link to="/insights" className="text-sm font-medium text-primary hover:underline cursor-pointer">
        View all insights
       </Link>
      </div>
      <div className="stagger-enter grid grid-cols-1 md:grid-cols-2 gap-4">
       {insights.data.sections.slice(0, 4).map((section) => (
        <InsightSectionCard key={section.key} section={section} interval="week" />
       ))}
      </div>
     </div>
    )}
   </div>
  </div>
 )
}
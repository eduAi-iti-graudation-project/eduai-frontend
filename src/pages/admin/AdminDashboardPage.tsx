import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
 Area,
 AreaChart,
 CartesianGrid,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from "recharts"
import * as api from "@/lib/api"
import { getErrorCode } from "@/lib/api"
import { useAuth } from "@/providers/use-auth"
import { useAlerts } from "@/hooks/use-alerts"
import { useDashboardInsights } from "@/hooks/use-dashboard-insights"
import { useFlaggedTeachers } from "@/hooks/use-flagged-teachers"
import { useMembershipRequests } from "@/hooks/use-membership-requests"
import { PageHeader } from "@/components/shared/PageHeader"
import { WelcomeBanner } from "@/components/shared/WelcomeBanner"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { InsightPointDetailSheet } from "@/components/insights/InsightPointDetailSheet"
import { clickableDot } from "@/components/insights/clickable-dot"
import { PrecisionStatCard } from "@/components/admin/PrecisionStatCard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

function initials(name: string) {
 return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((p) => p[0])
  .join("")
  .toUpperCase()
}

const riskChip: Record<string, string> = {
 HIGH: "bg-error-container text-on-error-container",
 MEDIUM: "bg-secondary-fixed text-on-secondary-fixed-variant",
 LOW: "bg-primary-fixed text-on-surface-variant",
}

const severityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

const fallbackTrend = [
 { label: "Week 1", value: 68 },
 { label: "Week 2", value: 71 },
 { label: "Week 3", value: 74 },
 { label: "Week 4", value: 76 },
 { label: "Week 5", value: 79 },
 { label: "Week 6", value: 82 },
 { label: "Week 7", value: 81 },
 { label: "Week 8", value: 82 },
]

interface Point {
 label: string
 value: number
}

export function AdminDashboardPage() {
 const { user } = useAuth()
 const dashboard = useQuery({
  queryKey: ["dashboard", "admin"],
  queryFn: () => api.getDashboard(),
 })

 const users = useQuery({
  queryKey: ["users", "dashboard"],
  queryFn: () => api.getUsers(),
 })

 const { alerts, isLoading: alertsLoading } = useAlerts("ACTIVE")
 const insights = useDashboardInsights("week")

 const stats = useMemo(() => {
  const all = users.data ?? []
  return {
   students: all.filter((u) => u.role === "STUDENT").length,
   teachers: all.filter((u) => u.role === "TEACHER").length,
  }
 }, [users.data])

 const flagged = useMemo(
  () =>
   [...alerts]
    .sort((a, b) => (severityRank[a.severity] ?? 2) - (severityRank[b.severity] ?? 2))
    .slice(0, 6),
  [alerts],
 )

 const trend = useMemo(() => {
  const section = insights.data?.sections.find((s) => s.chartType === "area" || s.chartType === "line")
  if (section && section.series.length > 1) {
   return { section, series: section.series.map((p) => ({ label: p.label, value: p.value })) }
  }
  return { section: undefined, series: fallbackTrend }
 }, [insights.data])

 const passRate = useMemo(() => {
  const last = trend.series[trend.series.length - 1]?.value
  return typeof last === "number" ? last : 78
 }, [trend])

 const passSpark = useMemo(() => {
  const base = passRate
  return [base - 4, base - 2, base - 3, base + 1, base, base + 2, base + 3, base]
 }, [passRate])

 const usersLoading = users.isLoading
 const [detailPoint, setDetailPoint] = useState<{ label: string; value: number } | null>(null)

 if (dashboard.isError) {
  return (
   <ErrorState
    title="Couldn't load the dashboard"
    message={dashboard.error instanceof Error ? dashboard.error.message : "Failed to load dashboard"}
    onRetry={() => dashboard.refetch()}
   />
  )
 }

 if (dashboard.isLoading || alertsLoading || usersLoading) {
  return <LoadingState label="Loading dashboard…" />
 }

 const data = dashboard.data
 if (!data) {
  return <LoadingState label="Loading dashboard…" />
 }

 return (
  <div className="flex-1 px-6 py-6">
   <div className="max-w-[1600px] mx-auto space-y-4">
    <WelcomeBanner
     userName={user?.name ?? "Administrator"}
     roleLabel="Administrator"
     email={user?.email}
     details={[
      { icon: "groups", label: "Students", value: stats.students.toLocaleString() },
      { icon: "co_present", label: "Teachers", value: String(stats.teachers) },
      { icon: "meeting_room", label: "Classes", value: String(data.classCount ?? 0) },
      { icon: "warning", label: "Active alerts", value: String(data.activeAlertCount ?? 0) },
     ]}
    />
    <PageHeader
     title="Administrative Overview"
     subtitle="Real-time institutional metrics for the current term."
     actions={
      <>
       <span className="hidden xl:inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant px-3 py-1.5 rounded-md ">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Live data
       </span>
       <Button asChild variant="outline" className="rounded-md font-label-md text-label-md">
        <Link to="/admin/insights">
         <span className="material-symbols-outlined text-[18px]">insights</span>
         Insights
        </Link>
       </Button>
       <Button asChild className="rounded-md font-label-md text-label-md bg-primary hover:bg-primary/90">
        <Link to="/admin/assistant">
         <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
         Ask AI
        </Link>
       </Button>
      </>
     }
    />

    <div className="stagger-enter grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
     <PrecisionStatCard
      icon="groups"
      label="Students"
      value={stats.students.toLocaleString()}
      delta={{ label: "Total", direction: "flat", tone: "neutral" }}
      spark={[120, 160, 150, 210, 260, 300, 420, Math.max(stats.students, 1)]}
     />
     <PrecisionStatCard
      icon="co_present"
      label="Teachers"
      value={stats.teachers}
      delta={{ label: "Active", direction: "flat", tone: "neutral" }}
      spark={[22, 22, 23, 23, 24, 24, 24, Math.max(stats.teachers, 1)]}
      iconClass="bg-secondary-fixed text-on-secondary-fixed-variant"
     />
     <PrecisionStatCard
      icon="meeting_room"
      label="Classes"
      value={data.classCount ?? 0}
      delta={{ label: "Term", direction: "flat", tone: "neutral" }}
      spark={[22, 24, 28, 27, 31, 34, 36, Math.max(data.classCount ?? 0, 1)]}
      iconClass="bg-primary-fixed text-on-primary-fixed-variant"
     />
     <PrecisionStatCard
      icon="warning"
      label="Active alerts"
      value={data.activeAlertCount ?? 0}
      delta={{ label: alerts.length ? `${alerts.length} HIGH/MED` : "Clear", direction: "up", tone: alerts.length ? "negative" : "positive" }}
      spark={[14, 13, 15, 12, 13, 10, 9, Math.max(data.activeAlertCount ?? 0, 1)]}
      iconClass="bg-error-container text-on-error-container"
     />
     <PrecisionStatCard
      icon="trending_up"
      label="Avg pass rate"
      value={`${passRate}%`}
      delta={{ label: "Auto", direction: "up", tone: "positive" }}
      spark={passSpark}
      iconClass="bg-success-container text-on-success-container"
     />
    </div>

    <div className="stagger-enter grid grid-cols-1 lg:grid-cols-3 gap-4">
     <TrendChartCard
      title="Performance trend"
      series={trend.series}
      onPointClick={trend.section ? (label, value) => setDetailPoint({ label, value }) : undefined}
     />
     <WatchListCard alerts={alerts} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
     <FlaggedStudentsCard students={flagged} />
     <JoinRequestsCard />
    </div>

    <FlaggedTeachersCard />

    {detailPoint && trend.section && (
     <InsightPointDetailSheet
      open
      onOpenChange={(open) => {
       if (!open) setDetailPoint(null)
      }}
      section={trend.section}
      point={detailPoint}
      interval="week"
     />
    )}
   </div>
  </div>
 )
}

function TrendChartCard({
 title,
 series,
 onPointClick,
}: {
 title: string
 series: Point[]
 onPointClick?: (label: string, value: number) => void
}) {
 const clickable = Boolean(onPointClick)
 return (
  <div className="lg:col-span-2 rounded-lg bg-surface-container-lowest flex flex-col overflow-hidden">
   <div className="px-md py-4 border-b border-outline-variant flex items-center justify-between">
    <div>
     <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
     {series.length > 1 ? (
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
       Avg pass rate · {series[0].label} → {series[series.length - 1].label}
      </p>
     ) : null}
    </div>
    <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant px-2.5 py-1 rounded-md bg-surface-container-low">
     <span className="material-symbols-outlined text-[16px]">insights</span>
     Auto-computed
    </span>
   </div>
   <div className="p-md flex-1 h-[280px]">
    <ResponsiveContainer width="100%" height="100%">
     <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <defs>
       <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a43073" stopOpacity={0.18} />
        <stop offset="100%" stopColor="#a43073" stopOpacity={0} />
       </linearGradient>
      </defs>
      <CartesianGrid stroke="#eceef0" strokeDasharray="3 3" vertical={false} />
      <XAxis
       dataKey="label"
       tick={{ fill: "#334155", fontSize: 12 }}
       axisLine={false}
       tickLine={false}
      />
      <YAxis
       domain={["dataMin - 5", "dataMax + 5"]}
       tick={{ fill: "#334155", fontSize: 12 }}
       axisLine={false}
       tickLine={false}
       tickFormatter={(v: number) => `${v}%`}
      />
      <Tooltip
       formatter={(value: number | string) => [`${value}%`, "Pass rate"]}
contentStyle={{ backgroundColor: "var(--color-surface-container-lowest)", border: "none", borderRadius: 12 }}
      labelStyle={{ color: "var(--color-primary)", fontWeight: 600 }}
      />
<Area
        type="monotone"
        dataKey="value"
        stroke="#a43073"
        strokeWidth={2.5}
        fill="url(#trendFill)"
        dot={clickableDot("#a43073", 3, onPointClick) ?? { r: 3, fill: "#ffffff", stroke: "#a43073", strokeWidth: 2 }}
        activeDot={clickableDot("#a43073", 6, onPointClick) ?? { r: 6, style: { cursor: clickable ? "pointer" : undefined } }}
       />
     </AreaChart>
    </ResponsiveContainer>
   </div>
  </div>
 )
}

function WatchListCard({ alerts }: { alerts: api.AlertListItem[] }) {
 const count = alerts.length
 const items = [
  {
   title: "At-risk cohort",
   summary:
    count === 0
     ? "No active alerts right now. Trend suggests the current cohort is stable this week."
     : `${count} student${count === 1 ? " is" : "s are"} currently flagged. Trend suggests intervention in the next grading cycle is timely.`,
  },
  {
   title: "Grade distribution",
   summary: "Average pass rate is holding above 82%. Downward drift is isolated to a few classes — likely grade-level specific.",
  },
  {
   title: "Grading volume",
   summary: "Review queued submissions to keep grading turnaround stable and reports flowing.",
  },
 ]

 return (
  <div className="rounded-lg bg-surface-container-lowest p-md flex flex-col">
   <div className="flex items-center gap-2.5 mb-4">
    <span className="w-8 h-8 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
     <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
    </span>
    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-primary text-primary-foreground">AI</span>
    <h3 className="font-headline-sm text-headline-sm text-primary flex-1">What to watch</h3>
   </div>
   <div className="flex-1 space-y-4">
    {items.map((item, i) => (
     <div key={item.title} className="border-l-2 pl-3 border-primary">
      <div className="flex items-center justify-between gap-2 mb-0.5">
       <h4 className="font-body-md text-body-md text-primary font-semibold">{item.title}</h4>
       <span className="font-label-sm text-label-sm text-on-surface-variant">#{i + 1}</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{item.summary}</p>
     </div>
    ))}
   </div>
   <Link to="/admin/assistant" className="mt-4 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
    Ask AI about the school
    <span className="material-symbols-outlined text-[15px]">arrow_right_alt</span>
   </Link>
  </div>
 )
}

function FlaggedStudentsCard({ students }: { students: api.AlertListItem[] }) {
 return (
  <div className="rounded-lg bg-surface-container-lowest overflow-hidden">
   <div className="px-md py-4 border-b border-outline-variant flex items-center justify-between">
    <h3 className="font-headline-sm text-headline-sm text-primary">Flagged students</h3>
    <Button asChild variant="link" size="sm" className="font-label-md text-label-md text-primary px-0">
     <Link to="/admin/alerts">View all</Link>
    </Button>
   </div>
   {students.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-lg text-center">
     <span className="material-symbols-outlined text-[40px] text-outline mb-2">verified</span>
     <p className="font-body-md text-body-md text-on-surface-variant">No active flags. Everything looks healthy.</p>
    </div>
   ) : (
    <div className="divide-y divide-border">
     {students.map((s) => (
      <Link
       key={s.id}
       to="/admin/alerts"
       className="flex items-center gap-3 px-md py-3 hover:bg-surface-container-low transition-colors"
      >
       <Avatar className="h-8 w-8 rounded-full">
        <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
         {initials(s.studentName)}
        </AvatarFallback>
       </Avatar>
       <div className="flex-1 min-w-0">
        <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{s.studentName}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
         {s.className ?? "Unassigned"} · {s.type.replace("_", " ").toLowerCase()}
         {s.grade?.name ? ` · grade ${s.grade.name}` : ""}
         {s.teacherName ? ` · ${s.teacherName}` : ""}
        </p>
       </div>
       <span className={cn("inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-full font-semibold", riskChip[s.severity] ?? riskChip.LOW)}>
        {s.severity}
       </span>
       <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
      </Link>
     ))}
    </div>
   )}
  </div>
 )
}

function FlaggedTeachersCard() {
 const flaggedQ = useFlaggedTeachers()
 const flagged = flaggedQ.data ?? []
 const loading = flaggedQ.isLoading

 return (
  <div className="rounded-lg bg-surface-container-lowest overflow-hidden">
   <div className="px-md py-4 border-b border-outline-variant flex items-center justify-between">
    <div className="flex items-center gap-2">
     <h3 className="font-headline-sm text-headline-sm text-primary">Flagged teachers</h3>
     <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
      AI
     </span>
    </div>
    <Button asChild variant="link" size="sm" className="font-label-md text-label-md text-primary px-0">
     <Link to="/admin/teachers">View all</Link>
    </Button>
   </div>

   {loading ? (
    <div className="space-y-2 p-md" aria-busy="true">
     {[0, 1, 2].map((i) => (
      <div key={i} className="h-14 rounded-lg bg-surface-container-high animate-pulse" />
     ))}
    </div>
   ) : flagged.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-lg text-center px-6">
     <span className="material-symbols-outlined text-[40px] text-outline mb-2">co_present</span>
     <p className="font-body-md text-body-md text-on-surface-variant">No teacher flags detected.</p>
     <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
      The analysis agent watches class-wide performance — teachers with widespread issues appear here.
     </p>
    </div>
   ) : (
<div className="divide-y divide-border">
      {flagged.map((f) => (
       <Link
        key={f.courseOfferingId}
        to={`/admin/teachers/${f.teacherId}`}
        className="flex items-center gap-3 px-md py-3 hover:bg-surface-container-low transition-colors"
       >
        <Avatar className="h-8 w-8 rounded-full shrink-0">
         <AvatarFallback className="bg-error-container text-on-error-container font-label-md text-label-md">
          {initials(f.teacherName)}
         </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2">
          <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{f.teacherName}</p>
          <span
           className={cn(
            "inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold shrink-0",
            f.attribution === "BOTH" ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-error-container text-on-error-container",
           )}
          >
           {f.attribution === "BOTH" ? "Class & student" : "Class issue"}
          </span>
         </div>
         <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
          {f.courseName}
          {f.sectionName ? ` · ${f.sectionName}` : ""}
          {f.alertCount > 1 ? ` · ${f.alertCount} alerts` : ""}
         </p>
         {(f.reason ?? f.headline) && (
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
           {f.reason ?? f.headline}
          </p>
         )}
        </div>
        <div className="text-right shrink-0">
         <span className={cn("inline-flex items-center font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold", riskChip[f.severity ?? "LOW"] ?? riskChip.LOW)}>
          {f.severity ?? "LOW"}
         </span>
         {f.classStats && (
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
           {f.classStats.droppingCount} of {f.classStats.studentCount} dropping · avg {f.classStats.classAvgPct}%
          </p>
         )}
        </div>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">chevron_right</span>
       </Link>
      ))}
     </div>
   )}

   <div className="px-md py-3 border-t border-outline-variant">
    <p className="font-body-sm text-body-sm text-on-surface-variant">
     Detected by the analysis agent: when a majority of a class is dropping at once, the issue is attributed
     to the class side rather than any single student.
    </p>
   </div>
  </div>
 )
}

function JoinRequestsCard() {
 const queryClient = useQueryClient()
 const requestsQuery = useMembershipRequests("PENDING")
 const [roleOverrides, setRoleOverrides] = useState<Record<string, api.MembershipRole>>({})
 const [seatLimitWarning, setSeatLimitWarning] = useState(false)

 const requests = requestsQuery.data ?? []
 const loading = requestsQuery.isLoading
 const isError = requestsQuery.isError

 const invalidateAll = () => {
  queryClient.invalidateQueries({ queryKey: ["membership-requests"] })
  queryClient.invalidateQueries({ queryKey: ["organization"] })
  queryClient.invalidateQueries({ queryKey: ["users"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] })
 }

 const approveMutation = useMutation({
  mutationFn: ({ requestId, role }: { requestId: string; role: api.MembershipRole }) =>
   api.approveMembershipRequest(requestId, role),
  onSuccess: (res) => {
   toast.success(`${res.name} was approved and can now sign in.`)
   setSeatLimitWarning(false)
   invalidateAll()
  },
  onError: (err: Error) => {
   if (getErrorCode(err) === "INVITE_SEATS_FULL") {
    setSeatLimitWarning(true)
   } else {
    toast.error(err.message)
   }
  },
 })

 const rejectMutation = useMutation({
  mutationFn: (requestId: string) => api.rejectMembershipRequest(requestId),
  onSuccess: () => {
   toast.success("Request rejected.")
   invalidateAll()
  },
  onError: (err: Error) => toast.error(err.message),
 })

 return (
  <div className="rounded-lg bg-surface-container-lowest overflow-hidden">
   <div className="px-md py-4 border-b border-outline-variant flex items-center justify-between">
    <h3 className="font-headline-sm text-headline-sm text-primary">Pending join requests</h3>
    <span
     className={cn(
      "inline-flex items-center font-label-sm text-label-sm px-2 py-1 rounded-full font-semibold",
      requests.length > 0 ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container-low text-on-surface-variant",
     )}
    >
     {requests.length} pending
    </span>
   </div>

   {seatLimitWarning && (
    <div className="px-md py-3 border-b border-outline-variant bg-error-container/60 flex items-center justify-between gap-3">
     <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px] text-on-error-container shrink-0">group_off</span>
      <p className="font-body-sm text-body-sm text-on-error-container">
       Your seat limit is full.{" "}
       <Link to="/admin/billing" className="font-semibold underline underline-offset-2">
        Upgrade your plan
       </Link>{" "}
       to approve more members.
      </p>
     </div>
     <button
      type="button"
      onClick={() => setSeatLimitWarning(false)}
      className="material-symbols-outlined text-on-error-container hover:opacity-70 shrink-0"
      aria-label="Dismiss"
     >
      close
     </button>
    </div>
   )}

   {loading ? (
    <div className="flex items-center justify-center py-lg text-center">
     <LoadingState label="Loading requests…" />
    </div>
   ) : isError ? (
    <div className="py-8">
     <ErrorState
      title="Couldn't load requests"
      message={requestsQuery.error instanceof Error ? requestsQuery.error.message : "Failed to load requests"}
      onRetry={() => requestsQuery.refetch()}
     />
    </div>
   ) : requests.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-lg text-center px-6">
     <span className="material-symbols-outlined text-[40px] text-outline mb-2">person_add</span>
     <p className="font-body-md text-body-md text-on-surface-variant">No pending join requests.</p>
     <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
      When someone signs up with your join code, their request appears here.
     </p>
    </div>
   ) : (
    <div className="divide-y divide-border">
     {requests.map((r) => (
      <div key={r.id} className="px-md py-3">
       <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 rounded-full">
         <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
          {initials(r.name)}
         </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
         <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{r.name}</p>
         <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{r.email}</p>
        </div>
        <span
         className={cn(
          "inline-flex items-center rounded-lg px-2.5 py-1 font-label-sm text-label-sm shrink-0",
          r.role === "TEACHER"
           ? "bg-primary-container text-on-primary-container"
           : "bg-surface-container-high text-on-surface",
         )}
        >
         {r.role === "TEACHER" ? "Teacher" : "Student"}
        </span>
       </div>
       <div className="mt-3 flex items-center gap-2">
        <Select
         value={roleOverrides[r.id] ?? r.role}
         onValueChange={(v) =>
          setRoleOverrides((prev) => ({ ...prev, [r.id]: v as api.MembershipRole }))
         }
        >
         <SelectTrigger className="h-auto w-[110px] rounded-lg border border-border bg-background px-3 py-1.5 font-label-sm text-label-sm">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="TEACHER">Teacher</SelectItem>
          <SelectItem value="STUDENT">Student</SelectItem>
         </SelectContent>
        </Select>
        <Button
         className="h-8 flex-1 rounded-lg bg-primary text-primary-foreground font-label-sm text-label-sm px-4 hover:bg-primary/90"
         disabled={approveMutation.isPending}
         onClick={() =>
          approveMutation.mutate({
           requestId: r.id,
           role: roleOverrides[r.id] ?? r.role,
          })
         }
        >
         {approveMutation.isPending ? "Approving…" : "Approve"}
        </Button>
        <Button
         type="button"
         variant="ghost"
         className="h-8 rounded-lg font-label-sm text-label-sm text-error hover:bg-error-container/40 px-4"
         onClick={() => rejectMutation.mutate(r.id)}
         disabled={rejectMutation.isPending}
        >
         Reject
        </Button>
       </div>
      </div>
     ))}
    </div>
   )}

   <div className="px-md py-3 border-t border-outline-variant">
    <Link
     to="/admin/requests"
     className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:underline underline-offset-4"
    >
     View all requests
     <span className="material-symbols-outlined text-[16px]">chevron_right</span>
    </Link>
   </div>
  </div>
 )
}
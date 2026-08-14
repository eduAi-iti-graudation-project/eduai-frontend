import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bot, CalendarDays, ListChecks, Send } from "lucide-react"
import {
  ScopeSearch,
} from "@/components/assistant/ScopeSearch"
import {
  scopeLabel,
  type AssistantScope,
  type ScopeGroup,
} from "@/components/assistant/scope"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { RichText } from "@/components/shared/RichText"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useAlerts } from "@/hooks/use-alerts"
import { useDashboardInsights } from "@/hooks/use-dashboard-insights"
import { MiniStat } from "@/components/admin/MiniStat"
import type { components } from "@/types/api-schema"
import * as api from "@/lib/api"

type Scope = AssistantScope

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const WAIT = 420

function briefForStudent(ctx: StudentCtx): string {
  const att = ctx.attendance
  const present = att.filter((a) => a.status === "PRESENT").length
  const absent = att.filter((a) => a.status === "ABSENT").length
  const late = att.filter((a) => a.status === "LATE").length
  const excused = att.filter((a) => a.status === "EXCUSED").length
  const total = att.length
  const lines = [
    `${ctx.name} is enrolled in ${ctx.classes.length} class${ctx.classes.length === 1 ? "" : "es"}: ${ctx.classes.map((c) => c.name).join(", ") || "none listed"}.`,
  ]
  if (total > 0) {
    lines.push(
      `Attendance (${total} records): ${present} present, ${absent} absent, ${late} late, ${excused} excused. ` +
        `Attendance rate: ${Math.round((present + late + excused) / total * 100)}%.`,
    )
  } else {
    lines.push("No attendance records are stored yet.")
  }
  if (ctx.insight && ctx.insight.sections.length > 0) {
    const perf = ctx.insight.sections.find((s) => s.chartType === "line" || s.chartType === "area")
    if (perf && perf.series.length > 0) {
      const last = perf.series[perf.series.length - 1]
      lines.push(`Current performance marker on insights reads ${last.value} on the latest interval.`)
    }
    ctx.insight.agentInsights.slice(0, 2).forEach((i) => lines.push(`• ${i.title}: ${i.summary}`))
  }
  return (
    lines.join("\n") +
    "\n\nYou can ask me about this student's attendance, classes, or how they're tracking overall."
  )
}

function answerFor(
  q: string,
  ctx: AnswerContext,
): string {
  const text = q.toLowerCase()
  const scope = ctx.scope
  const overview = ctx.overview

  if (/hello|hi\b|hey/.test(text)) {
    return "Hi — I'm the admin copilot. I read live data from your school: user counts, classes, active alerts, pending review work, and trend signals. Ask me about risk, review queues, attendance, or specific profiles."
  }

  if (scope.kind === "student" && ctx.attendance && text.includes("attendance")) {
    if (ctx.attendance.length === 0) return "No attendance records are stored for this student yet."
    const att = ctx.attendance
    const present = att.filter((a) => a.status === "PRESENT").length
    const absent = att.filter((a) => a.status === "ABSENT").length
    const late = att.filter((a) => a.status === "LATE").length
    const excused = att.filter((a) => a.status === "EXCUSED").length
    const rate = Math.round((present + late + excused) / att.length * 100)
    return `${scope.name} has ${att.length} attendance records. Present: ${present}, Absent: ${absent}, Late: ${late}, Excused: ${excused}. Overall attendance rate ≈ ${rate}%.`
  }

  if (scope.kind === "student" && ctx.classes && text.includes("class")) {
    if (ctx.classes.length === 0) return `${scope.name} is not enrolled in any classes yet.`
    return `${scope.name} is enrolled in ${ctx.classes.length} class${ctx.classes.length === 1 ? "" : "es"}:\n${ctx.classes.map((c) => `• ${c.name}`).join("\n")}`
  }

  if (scope.kind === "student" && /how is|doing|overall|status|summary/.test(text)) {
    return briefForStudent(ctx as StudentCtx)
  }

  if (text.includes("student")) {
    const n = ctx.students.length
    return `Your roster holds ${n} enrolled student${n === 1 ? "" : "s"}. You can scope into one in the search above to ask about attendance, classes, and performance.`
  }

  if (text.includes("teacher") || text.includes("faculty")) {
    const n = ctx.teachers.length
    return `There are ${n} ${n === 1 ? "teacher" : "teachers"} on staff. Ask about overall risk, review queues, or switch the scope to a specific teacher profile.`
  }

  if (text.includes("class")) {
    const n = overview?.classCount ?? 0
    return `There are ${n} active class${n === 1 ? "" : "es"} running this term.`
  }

  if (/risk|at-risk|flagged|alert/.test(text)) {
    const alerts = ctx.alerts ?? []
    if (alerts.length === 0) return "Good news — no active student alerts right now. The cohort looks stable."
    const high = alerts.filter((a) => a.severity === "HIGH").length
    const med = alerts.filter((a) => a.severity === "MEDIUM").length
    const top = alerts.slice(0, 5).map((a) => `• ${a.studentName} (${a.severity}) — ${a.type.replace("_", " ").toLowerCase()}`).join("\n")
    return `${alerts.length} student(s) are currently flagged (${high} HIGH, ${med} MEDIUM). Top of list:\n${top}`
  }

  if (/review|queue|pending|waiting/.test(text)) {
    const subs = overview?.submissionsNeedingReview ?? []
    const pending = overview?.pendingConfirmations ?? 0
    const out: string[] = []
    if (subs.length > 0) out.push(`${subs.length} submissions are awaiting review:\n${subs.slice(0, 5).map((s) => `• ${s.studentName} — ${s.assignmentTitle}`).join("\n")}`)
    if (pending > 0) out.push(`• ${pending} confirmation${pending === 1 ? "" : "s"} are still pending on your side.`)
    if (out.length === 0) return "Nothing is waiting on you right now — the review and confirmation queues are clear."
    return out.join("\n")
  }

  if (text.includes("trend") || text.includes("average") || text.includes("pass") || text.includes("perform")) {
    const section = ctx.insights?.sections.find((s) => s.chartType === "line" || s.chartType === "area")
    if (section && section.series.length > 1) {
      const first = section.series[0].value
      const last = section.series[section.series.length - 1].value
      const dir = last >= first ? "up" : "down"
      const delta = Math.abs(last - first).toFixed(1)
      return `The pass-rate trend moved ${dir} by ${delta} points over the interval (${first}% → ${last}%).${section.delta ? ` Latest delta: ${section.delta.direction} ${Math.abs(section.delta.deltaPercent).toFixed(1)}%.` : ""}`
    }
    return "I don't have enough interval data to describe a performance trend yet."
  }

  if (text.includes("summary") || text.includes("health") || text.includes("today")) {
    return answerFor("students, teachers, classes, alerts, review", ctx)
  }

  return (
    "I can answer questions about: counts (students / teachers / classes), at-risk & flagged students, the review queue, performance trends, and (per profile) attendance, classes and overall status. " +
    "Tip: use the scope search above to target a specific student or teacher."
  )
}

interface StudentCtx {
  name: string
  classes: api.StudentClass[]
  attendance: components["schemas"]["AttendanceResponseDto"][]
  insight?: api.InsightsResponse
}

type AnswerContext = {
  scope: Scope
  overview?: api.DashboardOverview
  alerts: api.AlertListItem[]
  students: string[]
  teachers: string[]
  insights?: api.InsightsResponse
} & Partial<StudentCtx>

export function AdminAssistantPage() {
  const [scope, setScope] = useState<Scope>({ kind: "all" })
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [pending, setPending] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const overviewQ = useQuery({ queryKey: ["dashboard", "admin"], queryFn: () => api.getDashboard() })
  const usersQ = useQuery({ queryKey: ["users", "assistant"], queryFn: () => api.getUsers() })
  const { alerts, isLoading: alertsLoading } = useAlerts("ACTIVE")
  const insightsQ = useDashboardInsights("week")

  const scopedStudentId = scope.kind === "student" ? scope.id : null

  const studentInsightQ = useQuery({
    queryKey: ["dashboard-insights", { studentId: scopedStudentId }],
    queryFn: () => api.getStudentInsights(scopedStudentId!, "week"),
    enabled: !!scopedStudentId,
  })
  const studentAttendanceQ = useQuery({
    queryKey: ["assistant", "attendance", scopedStudentId],
    queryFn: () => api.getStudentAttendance(scopedStudentId!),
    enabled: !!scopedStudentId,
  })
  const studentClassesQ = useQuery({
    queryKey: ["assistant", "classes", scopedStudentId],
    queryFn: () => api.getStudentClasses(scopedStudentId!),
    enabled: !!scopedStudentId,
  })

  const students = useMemo(() => (usersQ.data ?? []).filter((u) => u.role === "STUDENT"), [usersQ.data])
  const teachers = useMemo(() => (usersQ.data ?? []).filter((u) => u.role === "TEACHER"), [usersQ.data])

  const scopeGroups = useMemo<ScopeGroup[]>(
    () => [
      { label: "Students", kind: "student", items: students.map((s) => ({ id: s.id, name: s.name })) },
      { label: "Teachers", kind: "teacher", items: teachers.map((t) => ({ id: t.id, name: t.name })) },
    ],
    [students, teachers],
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pending])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  function switchScope(next: Scope) {
    setScope(next)
    setMessages([])
  }

  function ask(question: string) {
    if (!question.trim() || pending) return
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: question }
    setMessages((prev) => [...prev, userMsg])
    setPending(true)
    const ctx: AnswerContext = {
      scope,
      overview: overviewQ.data,
      alerts: alerts ?? [],
      students: students.map((s) => s.name),
      teachers: teachers.map((t) => t.name),
      insights: insightsQ.data,
      ...(scope.kind === "student"
        ? {
            name: scope.name,
            classes: studentClassesQ.data ?? [],
            attendance: studentAttendanceQ.data ?? [],
            insight: studentInsightQ.data,
          }
        : {}),
    }
    timeoutRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answerFor(question, ctx) },
      ])
      setPending(false)
    }, WAIT)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      ask(input)
      setInput("")
    }
  }

  if (overviewQ.isError) {
    return (
      <ErrorState
        title="Couldn't load the assistant"
        message={overviewQ.error instanceof Error ? overviewQ.error.message : "Failed to load"}
        onRetry={() => overviewQ.refetch()}
      />
    )
  }

  if (overviewQ.isLoading || usersQ.isLoading || alertsLoading) {
    return <LoadingState label="Preparing data…" />
  }

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <PageHeader
          title="AI Assistant"
          subtitle="Ask questions about your school or a specific profile — answers are computed from live data."
          actions={
            <ScopeSearch
              value={scope}
              groups={scopeGroups}
              placeholder="Search students or teachers…"
              clearLabel="School-wide"
              onChange={(next) => switchScope(next)}
              className="w-full min-w-[220px] max-sm:w-[220px] sm:w-[280px]"
            />
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <section className="lg:col-span-2 rounded-lg bg-surface-container-lowest border border-outline-variant flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="font-label-md text-label-md text-on-surface-variant">
                {scopeLabel(scope, "School-wide")}
              </span>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="ml-auto font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
                >
                  Clear
                </button>
              )}
            </div>

            {messages.length === 0 && (
              <div className="px-5 py-8 flex-1">
                <div className="flex flex-col items-center text-center gap-3 mb-6">
                  <span className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Ask about the school</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[31.25rem] mx-auto mt-1">
                      Answers are assembled from your live API data — school counts, alerts, queues and trend signals. No chat request leaves the frontend.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-5 pb-2 flex flex-wrap justify-center gap-2">
              {suggestionsFor(scope).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { ask(s); setInput("") }}
                  className="font-label-md text-label-md px-3 py-1.5 rounded-md border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 flex-1 space-y-3 overflow-y-auto max-h-[420px]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-lg px-4 py-3 font-body-md text-body-md ${m.role === "user" ? "bg-primary text-on-primary rounded-br-[6px] whitespace-pre-wrap" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-[6px]"}`}>
                    {m.role === "user" ? m.content : <RichText text={m.content} />}
                  </div>
                </div>
              ))}
              {pending && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-lg rounded-bl-[6px] px-4 py-3 bg-surface-container-low border border-outline-variant">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-5 py-3 border-t border-outline-variant flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Which students are at risk right now?"
                rows={1}
                className="flex-1 bg-surface-container-low rounded-md border border-outline-variant px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 resize-none"
              />
              <Button
                type="button"
                onClick={() => { ask(input); setInput("") }}
                disabled={!input.trim() || pending}
                aria-label="Send message"
                className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </section>

          <aside className="space-y-4">
            <SchoolBriefCard
              overview={overviewQ.data}
              insights={insightsQ.data}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function suggestionsFor(scope: Scope): string[] {
  if (scope.kind === "student") {
    return ["How is this student doing overall?", "How is their attendance?", "Which classes are they in?"]
  }
  if (scope.kind === "teacher") {
    return ["Add triggers, alerts and review queue for this teacher"]
  }
  return [
    "How many students, teachers and classes do we have?",
    "Which students are at risk right now?",
    "What's waiting in the review queue?",
  ]
}

function SchoolBriefCard({
  overview,
  insights,
}: {
  overview: api.DashboardOverview | undefined
  insights: api.InsightsResponse | undefined
}) {
  const trend = insights?.sections.find((s) => s.chartType === "line" || s.chartType === "area")
  const last = trend?.series[trend.series.length - 1]
  const queue = overview?.submissionsNeedingReview.length ?? 0
  return (
    <div className="rounded-card bg-surface-container-lowest border border-outline-variant p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 shrink-0 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
          <CalendarDays className="w-4.5 h-4.5" />
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-none">Daily brief</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">School-wide, computed now</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <MiniStat icon="notifications_active" label="Active alerts" value={overview?.activeAlertCount ?? 0} tone={overview?.activeAlertCount ? "danger" : "default"} />
        <MiniStat icon="playlist_add_check" label="Awaiting review" value={queue} tone={queue ? "warning" : "default"} />
        <MiniStat icon="styles" label="Performance" value={typeof last?.value === "number" ? `${last.value}%` : "—"} />
        <MiniStat icon="confirmation_number" label="Confirmations" value={overview?.pendingConfirmations ?? 0} />
      </dl>
      <ul className="mt-4 space-y-2">
        {(insights?.agentInsights.length ? insights.agentInsights.slice(0, 2) : []).map((i) => (
          <li key={`${i.title}-${i.summary}`}>
            <p className="font-label-md text-label-md text-on-surface font-semibold mb-1">{i.title}</p>
            {i.breakdown ? (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {i.breakdown.headline || i.breakdown.type.replace("_", " ").toLowerCase()} · {i.breakdown.highlights[0]}
              </p>
            ) : (
              <div className="[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                <RichText text={i.summary} />
              </div>
            )}
          </li>
        ))}
        {!insights?.agentInsights.length && (
          <li className="rounded-md border border-outline-variant bg-surface-container-low px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 shrink-0 rounded flex items-center justify-center bg-primary-fixed text-on-primary-fixed-variant">
                <ListChecks className="w-3.5 h-3.5" />
              </span>
              <p className="font-label-md text-label-md text-on-surface font-semibold">Review queue</p>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {queue} submission{queue === 1 ? "" : "s"} need attention — keep grading turnaround steady.
            </p>
          </li>
        )}
      </ul>
    </div>
  )
}
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Bot, CalendarDays } from "lucide-react"
import { ScopeSearch } from "@/components/assistant/ScopeSearch"
import { scopeLabel, type AssistantScope, type ScopeGroup } from "@/components/assistant/scope"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RichText } from "@/components/shared/RichText"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { MiniStat } from "@/components/admin/MiniStat"
import { GuardianAgentGraph } from "@/components/guardian/GuardianAgentGraph"
import { ChatHistorySidebar } from "@/components/assistant/ChatHistorySidebar"
import { useGuardianChat } from "@/hooks/use-guardian-chat"
import { computeChildSummary, attendanceSummaryLine } from "@/lib/child-stats"
import { toast } from "sonner"
import type { components } from "@/types/api-schema"
import type { StudentGrade, StudentClass, InsightsResponse, GuardianAlertSummary, GuardianChatMessage } from "@/lib/api"
import * as api from "@/lib/api"

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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

interface ChildCtx {
  name: string
  className: string
  grades: StudentGrade[]
  attendance: components["schemas"]["AttendanceResponseDto"][]
  classes: StudentClass[]
  alerts: GuardianAlertSummary[]
  insight?: InsightsResponse
}

const WAIT = 420

function childBrief(ctx: ChildCtx): string {
  const summary = computeChildSummary(ctx.grades, ctx.attendance)
  const lines: string[] = []
  lines.push(
    `${ctx.name} is in ${ctx.className || "a class"} and is enrolled in ${ctx.classes.length} class${ctx.classes.length === 1 ? "" : "es"}: ${ctx.classes.map((c) => c.name).join(", ") || "none listed"}.`,
  )
  if (summary.confirmedCount > 0) {
    lines.push(`Confirmed grades: ${summary.confirmedCount} scored item${summary.confirmedCount === 1 ? "" : "s"} with an average of ${summary.overallAverage} points.`)
  } else {
    lines.push("No confirmed grades are stored yet.")
  }
  lines.push(attendanceSummaryLine(ctx.name, ctx.attendance))
  if (ctx.alerts.length > 0) {
    lines.push(`Active alerts: ${ctx.alerts.length} — ${ctx.alerts.slice(0, 3).map((a) => a.type.replace("_", " ").toLowerCase()).join(", ")}.`)
  }
  if (ctx.insight && ctx.insight.agentInsights.length > 0) {
    ctx.insight.agentInsights.slice(0, 2).forEach((i) => lines.push(`• ${i.title}: ${i.summary}`))
  }
  return (
    lines.join("\n") +
    "\n\nYou can ask about attendance, grades, classes, alerts or how your child is tracking overall."
  )
}

/**
 * Deterministic fast-path: answers well-known questions instantly from live
 * data with zero latency and zero tokens. Returns null when the question is
 * not a known intent so the caller can fall back to the LLM copilot.
 */
function matchGuardianIntent(q: string, ctx: ChildCtx): string | null {
  const text = q.toLowerCase()
  const name = ctx.name

  if (/hello|hi\b|hey/.test(text)) {
    return `Hi — I'm the guardian copilot for ${name}. I read live data about your child: attendance, grades, classes, alerts and trend signals. Ask me how ${name.split(" ")[0]} is doing at school.`
  }

  if (text.includes("attendance")) {
    if (ctx.attendance.length === 0) return `${name} has no attendance records stored yet.`
    const s = computeChildSummary([], ctx.attendance)
    return `${name} has ${ctx.attendance.length} attendance record${ctx.attendance.length === 1 ? "" : "s"}. Present: ${s.present}, Absent: ${s.absent}, Late: ${s.late}, Excused: ${s.excused}. Overall attendance rate ≈ ${s.attendanceRate}%.`
  }

  if (/grade|score|mark|average/.test(text)) {
    const confirmed = ctx.grades.filter((g) => g.isConfirmed)
    if (confirmed.length === 0) return `${name} has no confirmed grades yet.`
    const avg = Math.round(confirmed.reduce((sum, g) => sum + g.pointsAwarded, 0) / confirmed.length)
    const highest = Math.max(...confirmed.map((g) => g.pointsAwarded))
    return `${name} has ${confirmed.length} confirmed grade${confirmed.length === 1 ? "" : "s"} with an average of ${avg} points. Highest score: ${highest}.`
  }

  if (/class|course|enrolled|subject/.test(text)) {
    if (ctx.classes.length === 0) return `${name} is not enrolled in any classes yet.`
    return `${name} is enrolled in ${ctx.classes.length} class${ctx.classes.length === 1 ? "" : "es"}:\n${ctx.classes.map((c) => `• ${c.name}`).join("\n")}`
  }

  if (/alert|at-risk|flagged|concern|worried|attention/.test(text)) {
    if (ctx.alerts.length === 0) return `Good news — no active alerts on ${name} right now. Everything looks calm.`
    const high = ctx.alerts.filter((a) => a.severity === "HIGH").length
    const top = ctx.alerts.slice(0, 5).map((a) => `• ${a.type.replace("_", " ").toLowerCase()} (${a.severity ?? "INFO"}) — ${a.reason}`).join("\n")
    return `${name} has ${ctx.alerts.length} active alert${ctx.alerts.length === 1 ? "" : "s"} (${high} HIGH). Top of list:\n${top}`
  }

  if (/how is|doing|overall|status|summary|health|today/.test(text)) {
    return childBrief(ctx)
  }

  return null
}

function suggestionsFor(childName: string): string[] {
  const first = childName.split(" ")[0]
  return [
    `How is ${first} doing overall?`,
    `How is ${first}'s attendance?`,
    `What grades has ${first} gotten?`,
    `Are there any alerts on ${first}?`,
  ]
}

export function GuardianAssistantPage() {
  const [searchParams] = useSearchParams()
  const requestedStudentId = searchParams.get("student") ?? ""

  const [scope, setScope] = useState<AssistantScope>({ kind: "student", id: requestedStudentId, name: "" })
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [pending, setPending] = useState(false)
  const [conversations, setConversations] = useState<api.AiChatConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true)
    try {
      const data = await api.listGuardianConversations()
      setConversations(data.items)
    } catch {
      // Sidebar is non-critical.
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  const handleAssistantReply = useCallback((reply: string, sources: string[], conversationId: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: reply, sources },
    ])
    if (conversationId) {
      setActiveConversationId(conversationId)
      void refreshConversations()
    }
  }, [refreshConversations])

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshConversations()
    }, 0)
    return () => clearTimeout(t)
  }, [refreshConversations])

  const dashboard = useQuery({
    queryKey: ["dashboard", "guardian"],
    queryFn: async () => {
      const data = await api.getDashboard()
      return data as unknown as GuardianDashboardOverview
    },
  })

  const children = useMemo(() => dashboard.data?.children ?? [], [dashboard.data])

  const child = useMemo(() => {
    if (children.length === 0) return null
    const preferredId =
      requestedStudentId && children.some((c) => c.id === requestedStudentId)
        ? requestedStudentId
        : scope.kind === "student" && scope.id
          ? scope.id
          : ""
    return children.find((c) => c.id === preferredId) ?? children[0]
  }, [children, requestedStudentId, scope.kind, scope.id])

  const effectiveScope: AssistantScope = child
    ? { kind: "student", id: child.id, name: child.name }
    : scope

  const childId = child?.id ?? ""

  const { sendMessage, step, lastToolStep, isStreaming } = useGuardianChat(childId, handleAssistantReply)

  const gradesQ = useQuery({
    queryKey: ["student-grades", childId],
    queryFn: () => api.getStudentGrades(childId),
    enabled: !!childId,
  })
  const attendanceQ = useQuery({
    queryKey: ["student-attendance", childId],
    queryFn: () => api.getStudentAttendance(childId),
    enabled: !!childId,
  })
  const classesQ = useQuery({
    queryKey: ["student", "classes", childId],
    queryFn: () => api.getStudentClasses(childId),
    enabled: !!childId,
  })
  const insightQ = useQuery({
    queryKey: ["dashboard-insights", { studentId: childId, interval: "week" }],
    queryFn: () => api.getStudentInsights(childId, "week"),
    enabled: !!childId,
  })
  const alertsQ = useQuery({
    queryKey: ["guardian", "alerts"],
    queryFn: () => api.getGuardianAlerts(),
  })

  const scopedAlerts = useMemo(
    () => (alertsQ.data ?? []).filter((a) => a.studentId === childId),
    [alertsQ.data, childId],
  )

  const totalActiveAlerts = children.reduce((sum, c) => sum + c.activeAlertCount, 0)
  const avgAttendance =
    children.length > 0
      ? Math.round(children.reduce((sum, c) => sum + c.attendanceRate, 0) / children.length)
      : 0

  const scopeGroups = useMemo<ScopeGroup[]>(
    () => [{ label: "Your children", kind: "student", items: children.map((c) => ({ id: c.id, name: c.name })) }],
    [children],
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pending, isStreaming])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

function switchScope(next: AssistantScope) {
  setScope(next)
  setMessages([])
  setActiveConversationId(null)
}

function startFresh() {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
  setActiveConversationId(null)
  setMessages([])
  setPending(false)
  setInput("")
}

async function openConversation(conversationId: string) {
  const conv = conversations.find((c) => c.id === conversationId)
  if (conv?.studentId) {
    setScope({ kind: "student", id: conv.studentId, name: "" })
  }
  setActiveConversationId(conversationId)
  try {
    const stored = await api.getGuardianConversation(conversationId)
    setMessages(
      stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources ?? undefined,
      })),
    )
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to load this chat")
    setActiveConversationId(null)
  }
}

async function deleteConversation(conversationId: string) {
  try {
    await api.deleteGuardianConversation(conversationId)
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    if (activeConversationId === conversationId) startFresh()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to delete this chat")
  }
}

  function ask(question: string) {
    if (!question.trim() || pending || isStreaming || !child) return
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: question }
    setMessages((prev) => [...prev, userMsg])
    const ctx: ChildCtx = {
      name: child.name,
      className: child.className,
      grades: gradesQ.data ?? [],
      attendance: attendanceQ.data ?? [],
      classes: classesQ.data ?? [],
      alerts: scopedAlerts,
      insight: insightQ.data,
    }
    const computed = matchGuardianIntent(question, ctx)
    if (computed) {
      setPending(true)
      timeoutRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: computed },
        ])
        setPending(false)
      }, WAIT)
      return
    }
    const history: GuardianChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }))
    sendMessage(question, history, activeConversationId ?? undefined)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      ask(input)
      setInput("")
    }
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Couldn't load the assistant"
        message={dashboard.error instanceof Error ? dashboard.error.message : "Failed to load"}
        onRetry={() => dashboard.refetch()}
      />
    )
  }

  if (dashboard.isLoading) {
    return <LoadingState label="Preparing data…" />
  }

  if (children.length === 0) {
    return (
      <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
        <header className="mb-6 border-b border-border pb-3">
          <h1 className="font-headline-xl text-headline-xl text-primary">Guardian Assistant</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Ask about your child's progress at school</p>
        </header>
        <EmptyState
          icon="family_history"
          title="No children linked"
          description="When a child is linked to your account, you can ask the assistant about their attendance, grades and progress."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <header className="mb-6 border-b border-border pb-3">
        <h1 className="font-headline-xl text-headline-xl text-primary">Guardian Assistant</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Ask about your child's attendance, grades and progress — common questions answer instantly, the rest goes to the AI copilot.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <section className="lg:col-span-2 rounded-lg bg-surface-container-lowest border border-outline-variant flex overflow-hidden">
          <ChatHistorySidebar
            conversations={conversations}
            activeId={activeConversationId}
            isLoading={conversationsLoading}
            onSelect={(id) => void openConversation(id)}
            onNew={startFresh}
            onDelete={(id) => void deleteConversation(id)}
            retentionNote="Only your most recent chats are kept."
          />
          <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-outline-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="font-label-md text-label-md text-on-surface-variant">
              {scopeLabel(effectiveScope, "Pick a child")}
            </span>
            <div className="ml-auto">
              <ScopeSearch
                value={effectiveScope}
                groups={scopeGroups}
                placeholder="Pick a child…"
                clearLabel="Pick a child"
                onChange={(next) => switchScope(next)}
                className="w-52"
              />
            </div>
          </div>

          {messages.length === 0 && (
            <div className="px-5 py-8 flex-1">
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <span className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Ask about {child?.name ?? "your child"}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[31.25rem] mx-auto mt-1">
                    Common questions (attendance, grades, classes, alerts) are answered instantly from live data — anything else is handled by the AI copilot.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 pb-2 flex flex-wrap justify-center gap-2">
            {child && suggestionsFor(child.name).map((s) => (
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
                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Sources</p>
                      <ul className="space-y-1">
                        {m.sources.map((s, i) => (
                          <li key={i} className="font-body-sm text-body-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-[13px] text-primary mr-1 align-[-2px]">article</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-lg rounded-bl-[6px] px-4 py-3 bg-surface-container-low border border-outline-variant">
                  <GuardianAgentGraph step={step} lastToolStep={lastToolStep} />
                </div>
              </div>
            )}
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
              placeholder={child ? `Ask about ${child.name}…` : "Pick a child to start…"}
              disabled={!child || pending || isStreaming}
              rows={1}
              className="flex-1 bg-surface-container-low rounded-md border border-outline-variant px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 resize-none"
            />
            <Button
              type="button"
              onClick={() => { ask(input); setInput("") }}
              disabled={!input.trim() || pending || isStreaming || !child}
              aria-label="Send message"
              className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </Button>
          </div>
          </div>
        </section>

        <aside className="space-y-4">
          <FamilyBriefCard
            child={child}
            childrenCount={children.length}
            activeAlerts={totalActiveAlerts}
            unreadNotifications={dashboard.data?.unreadNotifications ?? 0}
            avgAttendance={avgAttendance}
          />
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Go to</h3>
            <ul className="space-y-1">
              {[
                { to: child ? `/guardian/children/${child.id}` : "/guardian", icon: "family_history", label: child ? `${child.name}'s profile` : "Dashboard" },
                { to: child ? `/guardian/insights/students/${child.id}` : "/guardian/insights", icon: "monitoring", label: child ? `${child.name}'s insights` : "Insights" },
                { to: "/guardian/alerts", icon: "notifications_active", label: "All alerts" },
              ].map((item) => (
                <li key={item.to + item.label}>
                  <Link
                    to={item.to}
                    className="flex items-center gap-2 rounded-md px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function FamilyBriefCard({
  child,
  childrenCount,
  activeAlerts,
  unreadNotifications,
  avgAttendance,
}: {
  child: ChildSummary | null
  childrenCount: number
  activeAlerts: number
  unreadNotifications: number
  avgAttendance: number
}) {
  return (
    <div className="rounded-card bg-surface-container-lowest border border-outline-variant p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 shrink-0 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
          <CalendarDays className="w-4.5 h-4.5" />
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-none">Family brief</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Computed now</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <MiniStat icon="group" label="Children" value={childrenCount} />
        <MiniStat icon="notifications_active" label="Active alerts" value={activeAlerts} tone={activeAlerts ? "danger" : "default"} />
        <MiniStat icon="event_available" label="Avg attendance" value={`${avgAttendance}%`} tone={avgAttendance >= 75 ? "positive" : "warning"} />
        <MiniStat icon="schedule" label="Notifications" value={unreadNotifications} tone={unreadNotifications ? "warning" : "default"} />
      </dl>
      {child && (
        <p className="mt-4 rounded-md border border-outline-variant bg-surface-container-low px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
          Scoped to <span className="font-semibold text-on-surface">{child.name}</span> ({child.className}) — switch children above to compare.
        </p>
      )}
    </div>
  )
}
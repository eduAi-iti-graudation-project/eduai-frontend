import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bot, CalendarDays, ListChecks, Send } from "lucide-react"
import { ScopeSearch } from "@/components/assistant/ScopeSearch"
import {
  scopeLabel,
  type AssistantScope,
  type ScopeGroup,
} from "@/components/assistant/scope"
import { ChatHistorySidebar } from "@/components/assistant/ChatHistorySidebar"
import {
  useAdminAssistant,
  type AdminChatScope,
} from "@/hooks/use-admin-assistant"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { RichText } from "@/components/shared/RichText"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { useDashboardInsights } from "@/hooks/use-dashboard-insights"
import { MiniStat } from "@/components/admin/MiniStat"
import * as api from "@/lib/api"

type Scope = AssistantScope

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const STEP_LABELS: Record<api.AdminAgentStep, string> = {
  routing: "Deciding what to look at…",
  read_overview: "Reading the dashboard…",
  read_alerts: "Scanning active alerts…",
  read_insights: "Pulling insights…",
  read_requests: "Checking join requests…",
  read_billing: "Reviewing billing…",
  read_profile: "Reading the profile…",
  thinking: "Thinking…",
}

function adminScopeFrom(scope: Scope): AdminChatScope {
  if (scope.kind === "student") return { scopeStudentId: scope.id }
  if (scope.kind === "teacher") return { scopeTeacherId: scope.id }
  return {}
}

export function AdminAssistantPage() {
  const [scope, setScope] = useState<Scope>({ kind: "all" })
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<api.AiChatConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const overviewQ = useQuery({ queryKey: ["dashboard", "admin"], queryFn: () => api.getDashboard() })
  const usersQ = useQuery({ queryKey: ["users", "assistant"], queryFn: () => api.getUsers() })
  const insightsQ = useDashboardInsights("week")

  const students = useMemo(() => (usersQ.data ?? []).filter((u) => u.role === "STUDENT"), [usersQ.data])
  const teachers = useMemo(() => (usersQ.data ?? []).filter((u) => u.role === "TEACHER"), [usersQ.data])

  const scopeGroups = useMemo<ScopeGroup[]>(
    () => [
      { label: "Students", kind: "student", items: students.map((s) => ({ id: s.id, name: s.name })) },
      { label: "Teachers", kind: "teacher", items: teachers.map((t) => ({ id: t.id, name: t.name })) },
    ],
    [students, teachers],
  )

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true)
    try {
      const data = await api.listAdminConversations()
      setConversations(data.items)
    } catch {
      // Sidebar is non-critical; keep whatever we already have.
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshConversations()
    }, 0)
    return () => clearTimeout(t)
  }, [refreshConversations])

  const handleAssistantReply = useCallback(
    (reply: string, _sources: string[], conversationId: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ])
      setActiveConversationId(conversationId)
      void refreshConversations()
    },
    [refreshConversations],
  )

  const { sendMessage, step, isStreaming } = useAdminAssistant(handleAssistantReply)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming, messagesLoading])

  function switchScope(next: Scope) {
    if (JSON.stringify(next) !== JSON.stringify(scope)) startFresh()
    setScope(next)
  }

  function ask(question: string) {
    if (!question.trim() || isStreaming || messagesLoading) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: question },
    ])
    sendMessage(
      question,
      messages.map((m) => ({ role: m.role, content: m.content })),
      adminScopeFrom(scope),
      activeConversationId ?? undefined,
    )
  }

  function startFresh() {
    setActiveConversationId(null)
    setMessages([])
    setMessagesLoading(false)
    setInput("")
  }

  async function openConversation(conversationId: string) {
    const conv = conversations.find((c) => c.id === conversationId)
    setActiveConversationId(conversationId)
    setMessagesLoading(true)
    try {
      const stored = await api.getAdminConversation(conversationId)
      if (conv?.studentId) {
        const s = students.find((x) => x.id === conv.studentId)
        if (s) setScope({ kind: "student", id: s.id, name: s.name })
      }
      setMessages(
        stored.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load this chat")
      setActiveConversationId(null)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  async function deleteConversation(conversationId: string) {
    try {
      await api.deleteAdminConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (activeConversationId === conversationId) startFresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete this chat")
    }
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

  if (overviewQ.isLoading || usersQ.isLoading) {
    return <LoadingState label="Preparing data…" />
  }

  const stepLabel = step ? STEP_LABELS[step] : null

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <PageHeader
          title="AI Assistant"
          subtitle="An AI copilot with live access to your school's data — ask about the whole school or scope into one profile."
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
          <section className="lg:col-span-2 rounded-lg bg-surface-container-lowest flex overflow-hidden">
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
              <div className="px-md py-3 border-b border-outline-variant flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {scopeLabel(scope, "School-wide")}
                </span>
              </div>

              {messages.length === 0 && !isStreaming && (
                <div className="px-md py-8 flex-1">
                  <div className="flex flex-col items-center text-center gap-3 mb-6">
                    <span className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </span>
                    <div>
                      <h3 className="font-headline-md text-headline-md text-primary">Ask about the school</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[31.25rem] mx-auto mt-1">
                        The copilot reads your dashboard, active alerts, insights, join requests and billing to answer in plain language — and streams each step as it works.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-md pb-2 flex flex-wrap justify-center gap-2">
                {suggestionsFor(scope).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { ask(s); setInput("") }}
                    className="font-label-md text-label-md px-3 py-1.5 rounded-md bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="stagger-enter px-md py-4 flex-1 space-y-3 overflow-y-auto max-h-[420px]">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] rounded-lg px-4 py-3 font-body-md text-body-md ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-[6px] whitespace-pre-wrap" : "bg-surface-container-low text-on-surface rounded-bl-[6px]"}`}>
                      {m.role === "user" ? m.content : <RichText text={m.content} />}
                    </div>
                  </div>
                ))}
                {(isStreaming || messagesLoading) && (
                  <div className="flex justify-start">
                    <div className="max-w-[82%] rounded-lg rounded-bl-[6px] px-4 py-3 bg-surface-container-low">
                      {stepLabel ? (
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{stepLabel}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-lg bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="px-md py-3 border-t border-outline-variant flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Which students are at risk right now?"
                  rows={1}
                  className="flex-1 bg-surface-container-low rounded-md px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 resize-none"
                />
                <Button
                  type="button"
                  onClick={() => { ask(input); setInput("") }}
                  disabled={!input.trim() || isStreaming || messagesLoading}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
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
    return ["How many classes does this teacher teach?", "How much grading have they completed?"]
  }
  return [
    "Which students are at risk right now?",
    "How is the school doing this week?",
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
    <div className="rounded-card bg-surface-container-lowest p-md">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 shrink-0 rounded-md bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
          <CalendarDays className="w-4.5 h-4.5" />
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary leading-none">Daily brief</h3>
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
          <li className="rounded-md bg-surface-container-low px-4 py-3">
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
import {
 useEffect,
 useMemo,
 useRef,
 useState,
 useCallback,
} from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import { useAssistantChat } from "@/hooks/use-assistant"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { PageHeader } from "@/components/shared/PageHeader"
import { RichText } from "@/components/shared/RichText"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import {
 ScopeSearch,
} from "@/components/assistant/ScopeSearch"
import type { AssistantScope } from "@/components/assistant/scope"
import type { components } from "@/types/api-schema"
import * as api from "@/lib/api"
import { cn } from "@/lib/utils"

type TabId = "course" | "students"

export function AssistantPage() {
 const [tab, setTab] = useState<TabId>("course")
 const [searchParams] = useSearchParams()
 const initialOfferingId = searchParams.get("offeringId") ?? undefined

 return (
  <div className="flex h-full flex-col">
   <PageHeader
    title="AI Assistant"
    actions={
     <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low ">
      <button
       type="button"
       onClick={() => setTab("course")}
       className={cn(
        "px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors",
        tab === "course"
         ? "bg-surface-container-lowest text-on-surface shadow-card "
         : "text-on-surface-variant hover:text-on-surface",
       )}
      >
       Course
      </button>
      <button
       type="button"
       onClick={() => setTab("students")}
       className={cn(
        "px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors",
        tab === "students"
         ? "bg-surface-container-lowest text-on-surface shadow-card "
         : "text-on-surface-variant hover:text-on-surface",
       )}
      >
       Students
      </button>
     </div>
    }
   />
   <div className="flex-1 min-h-0">
    {tab === "course" ? (
     <CourseAssistantTab initialOfferingId={initialOfferingId} />
    ) : (
     <StudentsAssistantTab />
    )}
   </div>
  </div>
 )
}

// ── Course tab: real backend chat, scoped to an offering ──────────

function CourseAssistantTab({ initialOfferingId }: { initialOfferingId?: string }) {
 const { user } = useAuth()
 const [gradeId, setGradeId] = useState("")
 const [courseId, setCourseId] = useState("")
 const [offeringId, setOfferingId] = useState("")
 const [touched, setTouched] = useState(false)
 const [input, setInput] = useState("")
 const chatEndRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLTextAreaElement>(null)

 const gradesQ = useQuery({
  queryKey: ["assistant", "grades", user?.id],
  queryFn: () => api.getTeacherGrades(user!.id),
  enabled: !!user?.id,
 })

 const offeringsQ = useQuery({
  queryKey: ["assistant", "offerings", user?.id],
  queryFn: () => api.getTeacherOfferings(user!.id),
  enabled: !!user?.id,
 })

 const initialOffering = useMemo(
  () => offeringsQ.data?.find((o) => o.id === initialOfferingId),
  [offeringsQ.data, initialOfferingId],
 )

 const prefilledCourseQ = useQuery({
  queryKey: ["course", initialOffering?.course.id],
  queryFn: () => api.getCourse(initialOffering!.course.id),
  enabled: !!initialOffering && !touched,
 })

 const derivedGradeId = touched ? gradeId : (prefilledCourseQ.data?.gradeLevelId ?? "")
 const derivedCourseId = touched ? courseId : (initialOffering?.course.id ?? "")

 const gradeDetailQ = useQuery({
  queryKey: ["assistant", "grade-detail", user?.id, derivedGradeId],
  queryFn: () => api.getTeacherGrade(user!.id, derivedGradeId!),
  enabled: !!user?.id && !!derivedGradeId,
 })

 const grades = gradesQ.data ?? []
 const courses = gradeDetailQ.data?.courses ?? []

 const sectionOptions = useMemo(
  () =>
   (offeringsQ.data ?? []).filter(
    (o) => o.course.id === derivedCourseId,
   ),
  [offeringsQ.data, derivedCourseId],
 )

 const derivedOfferingId =
  touched ||
  !derivedCourseId ||
  !initialOfferingId ||
  !sectionOptions.some((o) => o.id === initialOfferingId)
   ? offeringId
   : initialOfferingId

 const { messages, sendMessage, clearMessages, isLoading } = useAssistantChat(derivedOfferingId || null)

 useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
 }, [messages])

 function handleSend() {
  if (!input.trim() || isLoading) return
  sendMessage(input)
  setInput("")
 }

 function handleKeyDown(e: React.KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
   e.preventDefault()
   handleSend()
  }
 }

 return (
  <div className="flex h-full flex-col">
   <div className="flex items-center gap-3 px-md pt-sm pb-sm shrink-0">
    <Select
     value={derivedGradeId}
     onValueChange={(v) => {
      setTouched(true)
      setGradeId(v)
      setCourseId("")
      setOfferingId("")
     }}
    >
     <SelectTrigger className="w-auto min-w-[150px] rounded-full bg-surface px-3 py-2 text-label-md text-on-surface form-input-focus">
      <SelectValue placeholder="Grade…" />
     </SelectTrigger>
     <SelectContent>
      {grades.length === 0 && (
       <p className="px-3 py-2 text-label-md text-on-surface-variant">
        No grades assigned yet
       </p>
      )}
      {grades.map((g) => (
       <SelectItem key={g.id} value={g.id}>
        Grade {g.level}
        {g.name ? ` — ${g.name}` : ""}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    <Select
     value={derivedCourseId}
     onValueChange={(v) => {
      setTouched(true)
      setCourseId(v)
      setOfferingId("")
     }}
     disabled={!derivedGradeId}
    >
     <SelectTrigger className="w-auto min-w-[180px] rounded-full bg-surface px-3 py-2 text-label-md text-on-surface form-input-focus disabled:opacity-50">
      <SelectValue placeholder="Course…" />
     </SelectTrigger>
     <SelectContent>
      {courses.length === 0 && (
       <p className="px-3 py-2 text-label-md text-on-surface-variant">
        {gradeId ? "No courses in this grade" : "Pick a grade first"}
       </p>
      )}
      {courses.map((c) => (
       <SelectItem key={c.id} value={c.id}>
        {c.name}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    <Select
     value={derivedOfferingId}
     onValueChange={(v) => {
      setTouched(true)
      setOfferingId(v)
     }}
     disabled={!derivedCourseId}
    >
     <SelectTrigger className="w-auto min-w-[150px] rounded-lg bg-surface px-3 py-2 text-sm text-on-surface form-input-focus disabled:opacity-50">
      <SelectValue placeholder="Section…" />
     </SelectTrigger>
     <SelectContent>
      {sectionOptions.length === 0 && (
       <p className="px-3 py-2 text-label-md text-on-surface-variant">
        {derivedCourseId
         ? "You don't teach this in any section"
         : "Pick a course first"}
       </p>
      )}
      {sectionOptions.map((o) => (
       <SelectItem key={o.id} value={o.id}>
        {o.section.name}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    {messages.length > 0 && (
     <Button
      type="button"
      variant="ghost"
      onClick={clearMessages}
      className="text-label-md text-on-surface-variant hover:text-on-surface hover:bg-transparent h-auto px-2 py-1"
     >
      Clear chat
     </Button>
    )}
   </div>

   <div className="flex-1 min-h-0 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
    {messages.length === 0 && (
     <div className="flex-1 flex items-center justify-center">
      <EmptyState
       icon="psychology"
       title="How can I help you?"
       description="Pick a grade, course and section, then ask me to create quizzes, summarize materials, or get teaching suggestions for that class."
      />
     </div>
    )}

    <div className="stagger-enter flex-1 space-y-4">
     {messages.map((msg) => (
      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
       <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "assistant" ? "bg-primary text-primary-foreground rounded-br-[6px]" : "bg-surface-container-high text-primary rounded-bl-[6px]"}`}>
        {msg.role === "user" ? (
         <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
        ) : (
         <RichText text={msg.content} />
        )}
        <p className={`font-label-sm text-label-sm mt-1 ${msg.role === "user" ? "text-on-primary/60" : "text-on-surface-variant"}`}>
         {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
       </div>
      </div>
     ))}
     {isLoading && (
      <div className="flex justify-start">
       <div className="max-w-[80%] rounded-lg rounded-bl-[6px] px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
         <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "0ms" }} />
         <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "150ms" }} />
         <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
       </div>
      </div>
     )}
     <div ref={chatEndRef} />
    </div>
   </div>

   <div className="max-w-3xl mx-auto w-full px-md pb-md md:pb-6 mb-24 md:mb-0">
    <div className="flex items-end gap-2 bg-surface-container-low rounded-lg p-2">
     <Textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={derivedOfferingId ? "Type your message..." : "Pick a grade, course and section to start chatting..."}
      disabled={!derivedOfferingId || isLoading}
      rows={1}
      className="flex-1 bg-transparent border-0 rounded-none shadow-none outline-none resize-none px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0"
     />
     <Button
      type="button"
      onClick={handleSend}
      disabled={!input.trim() || isLoading || !derivedOfferingId}
      aria-label="Send message"
      className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
     >
      <span className="material-symbols-outlined text-[20px]">send</span>
     </Button>
    </div>
   </div>
  </div>
 )
}

// ── Students tab: computed Q&A from live teacher data ─────────────

interface BriefStudent {
 id: string
 name: string
 email: string
}

interface StudentCtx {
 name: string
 classes: api.StudentClass[]
 attendance: components["schemas"]["AttendanceResponseDto"][]
 grades: api.StudentGrade[]
 insight?: api.InsightsResponse
}

type StudentsAnswerContext = {
 scope: AssistantScope
 roster: BriefStudent[]
 sectionCount: number
 upcomingAlerts: api.AlertListItem[]
 pendingSubs: { studentName: string; assignmentTitle: string }[]
 pendingConfirmations: number
} & Partial<StudentCtx>

const WAIT = 420

function attendanceLine(att: components["schemas"]["AttendanceResponseDto"][], label: string): string {
 if (att.length === 0) return `${label} has no attendance records stored yet.`
 const present = att.filter((a) => a.status === "PRESENT").length
 const absent = att.filter((a) => a.status === "ABSENT").length
 const late = att.filter((a) => a.status === "LATE").length
 const excused = att.filter((a) => a.status === "EXCUSED").length
 const rate = Math.round(((present + late + excused) / att.length) * 100)
 return `${label} has ${att.length} attendance record${att.length === 1 ? "" : "s"} (${present} present, ${absent} absent, ${late} late, ${excused} excused). Attendance rate ≈ ${rate}%.`
}

function studentBrief(ctx: StudentCtx): string {
 const lines: string[] = []
 const gradeTotal = ctx.grades.filter((g) => g.isConfirmed)
 if (gradeTotal.length > 0) {
  const avg = Math.round(gradeTotal.reduce((sum, g) => sum + g.pointsAwarded, 0) / gradeTotal.length)
  lines.push(`Confirmed grades: ${gradeTotal.length} scored item${gradeTotal.length === 1 ? "" : "s"} with an average of ${avg} points.`)
 } else {
  lines.push("No confirmed grades are stored yet.")
 }
 lines.push(attendanceLine(ctx.attendance, ctx.name))
 if (ctx.insight && ctx.insight.sections.length > 0) {
  ctx.insight.agentInsights.slice(0, 2).forEach((i) => lines.push(`• ${i.title}: ${i.summary}`))
 }
 return (
  lines.join("\n") +
  "\n\nYou can ask about this student's attendance, grades, classes, or overall tracking."
 )
}

function teacherStudentsAnswer(q: string, ctx: StudentsAnswerContext): string {
 const text = q.toLowerCase()
 const scope = ctx.scope

 if (/hello|hi\b|hey/.test(text)) {
  return "Hi — I'm your students copilot. I read live data from your dashboard: roster, alerts, pending review work, and per-student attendance and grades. Ask me about who needs attention, your review queue, or a specific student."
 }

 if (scope.kind === "student" && ctx.attendance && text.includes("attendance")) {
  return attendanceLine(ctx.attendance, scope.name!)
 }

 if (scope.kind === "student" && ctx.grades && /grade|score|mark/.test(text)) {
  const g = ctx.grades.filter((x) => x.isConfirmed)
  if (g.length === 0) return `${scope.name} has no confirmed grades yet.`
  const avg = Math.round(g.reduce((sum, x) => sum + x.pointsAwarded, 0) / g.length)
  return `${scope.name} has ${g.length} confirmed grade${g.length === 1 ? "" : "s"} with an average of ${avg} points. Highest: ${Math.max(...g.map((x) => x.pointsAwarded))}.`
 }

 if (scope.kind === "student" && ctx.classes && text.includes("class")) {
  if (ctx.classes.length === 0) return `${scope.name} has no classes yet.`
  return `${scope.name} is enrolled in ${ctx.classes.length} class${ctx.classes.length === 1 ? "" : "es"}:\n${ctx.classes.map((c) => `• ${c.name}`).join("\n")}`
 }

 if (scope.kind === "student" && /how is|doing|overall|status|summary/.test(text)) {
  return studentBrief({ name: scope.name!, classes: ctx.classes ?? [], attendance: ctx.attendance ?? [], grades: ctx.grades ?? [], insight: ctx.insight })
 }

 if (/how many|student count|roster/.test(text) || text.includes("students")) {
  const n = ctx.roster.length
  return `You teach ${n} student${n === 1 ? "" : "s"} across ${ctx.sectionCount} section${ctx.sectionCount === 1 ? "" : "s"}. Search for a student above for attendance, grades, risk and more.`
 }

 if (/risk|at-risk|attention|flagged|alert/.test(text)) {
  const scoped = scope.kind === "student"
  const alerts = ctx.upcomingAlerts.filter((a) => !scoped || a.studentName?.toLowerCase().includes(scope.name!.toLowerCase()))
  if (alerts.length === 0) {
   return scoped ? `No active alerts on ${scope.name} — all quiet.` : "Good news — no students are flagged right now."
  }
  const high = alerts.filter((a) => a.severity === "HIGH").length
  const top = alerts.slice(0, 5).map((a) => `• ${a.studentName ?? "Unknown"} (${a.severity}) — ${a.type.replace("_", " ").toLowerCase()}`).join("\n")
  return `${alerts.length} student alert${alerts.length === 1 ? "" : "s"} active (${high} HIGH). Top of list:\n${top}`
 }

 if (/review|queue|pending|waiting|submission/.test(text)) {
  const out: string[] = []
  if (ctx.pendingSubs.length > 0) {
   out.push(`${ctx.pendingSubs.length} submission${ctx.pendingSubs.length === 1 ? "" : "s"} awaiting review:\n${ctx.pendingSubs.slice(0, 5).map((s) => `• ${s.studentName} — ${s.assignmentTitle}`).join("\n")}`)
  }
  if (ctx.pendingConfirmations > 0) {
   out.push(`• ${ctx.pendingConfirmations} confirmation${ctx.pendingConfirmations === 1 ? "" : "s"} still pending on your side.`)
  }
  if (out.length === 0) return "Nothing is waiting on you right now — review and confirmation queues are clear."
  return out.join("\n")
 }

 if (text.includes("summary") || text.includes("health") || text.includes("today")) {
  return teacherStudentsAnswer("my students, alerts, review", ctx)
 }

 return (
  "I can answer questions about: your roster (counts), flagged/at-risk students, the review queue, and — for a specific student — attendance, grades, classes and overall status. " +
  "Tip: search a student above to scope the conversation."
 )
}

function suggestionsForStudents(scope: AssistantScope): string[] {
 if (scope.kind === "student") {
  return ["How is this student doing overall?", "How is their attendance?", "Any alerts on this student?"]
 }
 return [
  "How many students do I teach?",
  "Which students need attention right now?",
  "What's waiting in my review queue?",
 ]
}

function StudentsAssistantTab() {
 const { user } = useAuth()
 const [scope, setScope] = useState<AssistantScope>({ kind: "all" })
 const [input, setInput] = useState("")
 const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([])
 const [pending, setPending] = useState(false)
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
 const chatEndRef = useRef<HTMLDivElement>(null)

 const dashboard = useDashboardData()
 const classesQ = useQuery({
  queryKey: ["assistant", "roster", user?.id],
  queryFn: () => api.getTeacherClasses(user!.id),
  enabled: !!user?.id,
 })
 const submissionsQ = useQuery({
  queryKey: ["assistant", "submissions", user?.id],
  queryFn: () => api.getSubmissions(),
  enabled: !!user?.id,
 })

 const scopedStudentId = scope.kind === "student" ? scope.id : null
 const studentAttendanceQ = useQuery({
  queryKey: ["assistant", "attendance", scopedStudentId],
  queryFn: () => api.getStudentAttendance(scopedStudentId!),
  enabled: !!scopedStudentId,
 })
 const studentClassesQ = useQuery({
  queryKey: ["assistant", "student-classes", scopedStudentId],
  queryFn: () => api.getStudentClasses(scopedStudentId!),
  enabled: !!scopedStudentId,
 })
 const studentGradesQ = useQuery({
  queryKey: ["assistant", "student-grades", scopedStudentId],
  queryFn: () => api.getStudentGrades(scopedStudentId!),
  enabled: !!scopedStudentId,
 })
 const studentInsightQ = useQuery({
  queryKey: ["assistant", "student-insights", scopedStudentId],
  queryFn: () => api.getStudentInsights(scopedStudentId!, "week"),
  enabled: !!scopedStudentId,
 })

 const roster = useMemo(() => {
  const map = new Map<string, BriefStudent>()
  for (const cls of classesQ.data ?? []) {
   for (const s of cls.students) {
    if (!map.has(s.id)) map.set(s.id, { id: s.id, name: s.name, email: s.email })
   }
  }
  return [...map.values()]
 }, [classesQ.data])

 const sectionCount = classesQ.data?.length ?? 0

 const pendingSubs = useMemo(() => {
  return (submissionsQ.data ?? [])
   .filter((s) => s.status !== "CONFIRMED")
   .map((s) => ({
    studentName: s.student?.name ?? "Student",
    assignmentTitle: s.assignment?.title ?? "Untitled assignment",
   }))
 }, [submissionsQ.data])

 const upcomingAlerts = useMemo(
  () => dashboard.alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED"),
  [dashboard.alerts],
 )

 useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
 }, [messages, pending])

 useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

 function ask(question: string) {
  if (!question.trim() || pending) return
  const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: question }
  setMessages((prev) => [...prev, userMsg])
  setPending(true)
  const ctx: StudentsAnswerContext = {
   scope,
   roster,
   sectionCount,
   upcomingAlerts,
   pendingSubs,
   pendingConfirmations: dashboard.totalSubmissions - dashboard.confirmedSubmissions,
   ...(scope.kind === "student"
    ? {
      name: scope.name!,
      classes: studentClassesQ.data ?? [],
      attendance: studentAttendanceQ.data ?? [],
      grades: studentGradesQ.data ?? [],
      insight: studentInsightQ.data,
     }
    : {}),
  }
  timeoutRef.current = setTimeout(() => {
   setMessages((prev) => [
    ...prev,
    { id: crypto.randomUUID(), role: "assistant", content: teacherStudentsAnswer(question, ctx) },
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

 const scopeGroups = useCallback(
  () => [{ label: "Your students", kind: "student" as const, items: roster.map((s) => ({ id: s.id, name: s.name })) }],
  [roster],
 )

 return (
  <div className="flex h-full flex-col">
   <div className="flex items-center gap-3 px-md pt-sm pb-sm shrink-0">
    <ScopeSearch
     value={scope}
     groups={scopeGroups()}
     placeholder="All students…"
     clearLabel="All students"
     onChange={(next) => {
      setScope(next)
      setMessages([])
     }}
     className="w-64"
    />
    {messages.length > 0 && (
     <Button
      type="button"
      variant="ghost"
      onClick={() => setMessages([])}
      className="text-label-md text-on-surface-variant hover:text-on-surface hover:bg-transparent h-auto px-2 py-1"
     >
      Clear chat
     </Button>
    )}
   </div>

   <div className="flex-1 min-h-0 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
    {messages.length === 0 ? (
     <div className="flex-1 flex items-center justify-center">
      <EmptyState
       icon="co_present"
       title="Ask about your students"
       description="Counts, alerts, review queues and per-student attendance & grades — computed from your live data. Search a student above to zoom in."
      />
     </div>
    ) : (
     <div className="stagger-enter flex-1 space-y-4">
      {messages.map((msg) => (
       <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "assistant" ? "bg-primary text-primary-foreground rounded-br-[6px]" : "bg-surface-container-high text-primary rounded-bl-[6px]"}`}>
         {msg.role === "user" ? (
          <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
         ) : (
          <RichText text={msg.content} />
         )}
        </div>
       </div>
      ))}
      {pending && (
       <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg rounded-bl-[6px] px-4 py-3 bg-primary text-primary-foreground">
         <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-lg bg-background animate-bounce" style={{ animationDelay: "300ms" }} />
         </div>
        </div>
       </div>
      )}
      <div ref={chatEndRef} />
     </div>
    )}
   </div>

   <div className="max-w-3xl mx-auto w-full px-md pb-md md:pb-6 mb-24 md:mb-0">
    <div className="flex flex-wrap justify-center gap-2 pb-sm">
     {suggestionsForStudents(scope).map((s) => (
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
    <div className="flex items-end gap-2 bg-surface-container-low rounded-lg p-2">
     <Textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="e.g. Which students need attention right now?"
      rows={1}
      className="flex-1 bg-transparent border-0 rounded-none shadow-none outline-none resize-none px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0"
     />
     <Button
      type="button"
      onClick={() => { ask(input); setInput("") }}
      disabled={!input.trim() || pending}
      aria-label="Send message"
      className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
     >
      <span className="material-symbols-outlined text-[20px]">send</span>
     </Button>
    </div>
   </div>
  </div>
 )
}
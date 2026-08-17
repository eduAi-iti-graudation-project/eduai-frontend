import { useRef, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useHomeworkHelpChat } from "@/hooks/use-homework-help"
import { FeedbackButtons } from "@/components/student/FeedbackButtons"
import { HomeworkAgentGraph } from "@/components/student/HomeworkAgentGraph"
import { TypewriterText } from "@/components/student/TypewriterText"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

const actionConfig: Record<string, { icon: string; label: string }> = {
 HINT: { icon: "auto_awesome", label: "Hint" },
 EXPLANATION: { icon: "menu_book", label: "Explanation" },
 REDIRECT_TEACHER: { icon: "school", label: "Ask Teacher" },
}

function SourceText({ text }: { text: string }) {
 const parts = text.split(/(https?:\/\/[^\s<>"']+)/g)
 return (
  <>
   {parts.map((part, i) => {
    if (!part.startsWith("http://") && !part.startsWith("https://")) {
     return <span key={i}>{part}</span>
    }
    const href = part.replace(/[.,;:!?)]+$/, "")
    try {
     const url = new URL(href)
     if (url.protocol !== "http:" && url.protocol !== "https:") {
      return <span key={i}>{part}</span>
     }
     return (
      <a
       key={i}
       href={url.href}
       target="_blank"
       rel="noopener noreferrer"
       className="font-medium text-primary underline underline-offset-2 break-all hover:text-primary/80"
      >
       {href}
      </a>
     )
    } catch {
     return <span key={i}>{part}</span>
    }
   })}
  </>
 )
}

export function HomeworkHelpPage() {
 const { user } = useAuth()
 const [searchParams] = useSearchParams()
 const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get("course") ?? "")
 const [selectedAssignmentId, setSelectedAssignmentId] = useState(searchParams.get("assignment") ?? "")
 const [input, setInput] = useState("")
 const chatEndRef = useRef<HTMLDivElement>(null)

 const studentClasses = useQuery({
  queryKey: ["student", "courses", user?.id],
  queryFn: () => api.getStudentCourses(user!.id),
  enabled: !!user?.id,
 })

 const courses = studentClasses.data
 const courseValid =
  !!courses && !!selectedCourseId && courses.some((c) => c.id === selectedCourseId)
 const effectiveCourseId = courseValid ? selectedCourseId : ""
 const activeCourse = courseValid
  ? courses!.find((c) => c.id === selectedCourseId)!
  : undefined
 const effectiveAssignmentId =
  courseValid &&
  !!selectedAssignmentId &&
  !!activeCourse?.assignments.some((a) => a.id === selectedAssignmentId)
   ? selectedAssignmentId
   : ""

 const { messages, sendMessage, clearMessages, step, lastToolStep, isLoading } = useHomeworkHelpChat(
  effectiveCourseId || null,
  effectiveAssignmentId || null,
 )

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
   <PageHeader
    title="Homework Help"
    actions={
     <>
      <Link
       to="/student/homework-help/history"
       className="text-primary font-label-sm text-label-sm hover:underline shrink-0"
      >
       Help History →
      </Link>
      <Select
       value={effectiveCourseId}
       onValueChange={(value) => {
        setSelectedCourseId(value)
        setSelectedAssignmentId("")
       }}
      >
       <SelectTrigger className="form-input-focus rounded-full bg-surface px-3 py-2 text-label-md text-on-surface w-auto min-w-[170px]">
        <SelectValue placeholder="Select a course..." />
       </SelectTrigger>
       <SelectContent>
        {studentClasses.data?.map((c) => (
         <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
       </SelectContent>
      </Select>
      <Select
       value={effectiveAssignmentId}
       onValueChange={setSelectedAssignmentId}
       disabled={!effectiveCourseId}
      >
       <SelectTrigger className="form-input-focus rounded-full bg-surface px-3 py-2 text-label-md text-on-surface w-auto min-w-[200px] disabled:opacity-50">
        <SelectValue
         placeholder={
          effectiveCourseId
           ? (activeCourse?.assignments.length ?? 0) > 0
            ? "No specific assignment"
            : "No assignments in this course"
           : "Select a course first..."
         }
        />
       </SelectTrigger>
       <SelectContent>
        {activeCourse?.assignments.map((a) => (
         <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
        ))}
       </SelectContent>
      </Select>
     </>
    }
   />

   <div className="flex-1 min-h-0 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
    {messages.length === 0 && (
     <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
       <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
       </div>
       <h2 className="font-headline-md text-headline-md text-primary mb-2">Stuck on homework?</h2>
       <p className="font-body-md text-body-md text-on-surface-variant">
        Select a course and optionally an assignment, then ask a question — get hints, explanations, or a redirect to your teacher.
       </p>
      </div>
     </div>
    )}

    <div className="flex-1 space-y-4">
     {messages.map((msg) => {
      if (msg.role === "user") {
       return (
        <div key={msg.id} className="flex justify-end">
         <div className="max-w-[80%] rounded-lg px-4 py-3 bg-primary text-primary-foreground rounded-br-[6px]">
          <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
          <p className="font-label-sm text-label-sm mt-1 text-on-primary/60">
           {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
         </div>
        </div>
       )
      }

      const config = actionConfig[msg.action ?? ""] ?? { icon: "psychology", label: (msg.action ?? "Answer").replace(/_/g, " ") }

      return (
       <div key={msg.id} className="flex justify-start">
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-surface-container-low text-on-surface border border-border rounded-bl-[6px]">
         <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-label-sm text-label-sm px-2 py-0.5 rounded-lg mb-2">
          <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
          {config.label}
         </span>
         <TypewriterText key={msg.id} text={msg.content} />
         {msg.teacherNotified && (
          <p className="mt-2 flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
           <span className="material-symbols-outlined text-[14px]">notifications_active</span>
           Your teacher has been notified.
          </p>
         )}
         {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
           <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Sources</p>
           <ul className="space-y-1">
            {msg.sources.map((s, i) => (
             <li key={i} className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px] text-primary mr-1 align-[-2px]">article</span>
              <SourceText text={s} />
             </li>
            ))}
           </ul>
          </div>
         )}
         <div className="mt-3 pt-3 border-t border-border">
          <FeedbackButtons interactionId={msg.interactionId} currentFeedback={null} />
         </div>
         <p className="font-label-sm text-label-sm mt-2 text-on-surface-variant">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
         </p>
        </div>
       </div>
      )
     })}

     {isLoading && (
      <div className="flex justify-start">
       <HomeworkAgentGraph step={step} lastToolStep={lastToolStep} />
      </div>
     )}
     <div ref={chatEndRef} />
    </div>

    <div className="max-w-3xl mx-auto w-full px-md pb-md md:pb-6 mb-24 md:mb-0">
     <div className="flex items-end gap-2 bg-surface-container-low rounded-lg border border-border p-2">
      <textarea
       value={input}
       onChange={(e) => setInput(e.target.value)}
       onKeyDown={handleKeyDown}
       placeholder={effectiveCourseId ? "Ask your question..." : "Select a course to start asking..."}
       disabled={!effectiveCourseId || isLoading}
       rows={1}
       className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50"
      />
      <Button
       type="button"
       onClick={handleSend}
       disabled={!input.trim() || isLoading || !effectiveCourseId}
       size="icon"
       className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary disabled:opacity-40 transition-opacity hover:opacity-90 hover:bg-primary"
      >
       <span className="material-symbols-outlined text-[20px]">send</span>
      </Button>
     </div>
     {messages.length > 0 && (
      <Button
       type="button"
       variant="ghost"
       onClick={clearMessages}
       className="mt-2 h-auto p-0 text-label-md text-on-surface-variant hover:text-on-surface hover:bg-transparent transition-colors"
      >
       Clear chat
      </Button>
     )}
    </div>
   </div>
  </div>
 )
}

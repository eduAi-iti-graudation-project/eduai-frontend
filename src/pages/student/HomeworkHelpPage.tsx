import { useRef, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useHomeworkHelpChat } from "@/hooks/use-homework-help"
import { FeedbackButtons } from "@/components/student/FeedbackButtons"

const actionConfig: Record<string, { icon: string; label: string }> = {
  HINT: { icon: "auto_awesome", label: "Hint" },
  EXPLANATION: { icon: "menu_book", label: "Explanation" },
  REDIRECT_TEACHER: { icon: "school", label: "Ask Teacher" },
}

export function HomeworkHelpPage() {
  const { user } = useAuth()
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("")
  const [input, setInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, clearMessages, isLoading } = useHomeworkHelpChat(
    selectedClassId || null,
    selectedAssignmentId || null,
  )

  const studentClasses = useQuery({
    queryKey: ["student", "classes", user?.id],
    queryFn: () => api.getStudentClasses(user!.id),
    enabled: !!user?.id,
  })

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
    <div className="flex-1 flex flex-col">
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-lg text-headline-lg text-primary">Homework Help</h1>
          <Link
            to="/student/homework-help/history"
            className="text-primary font-label-sm text-label-sm hover:underline"
          >
            Help History →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value)
              setSelectedAssignmentId("")
            }}
            className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          >
            <option value="">Select a class...</option>
            {studentClasses.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            disabled={!selectedClassId}
            className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface disabled:opacity-50"
          >
            <option value="">
              {selectedClassId
                ? (studentClasses.data?.find((c) => c.id === selectedClassId)?.assignments.length ?? 0) > 0
                  ? "No specific assignment"
                  : "No assignments in this class"
                : "Select a class first..."}
            </option>
            {studentClasses.data
              ?.find((c) => c.id === selectedClassId)
              ?.assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
          </select>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Stuck on homework?</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Select a class and optionally an assignment, then ask a question — get hints, explanations, or a redirect to your teacher.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4">
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-[24px] px-4 py-3 bg-primary text-on-primary rounded-br-[6px]">
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
                <div className="max-w-[80%] rounded-[24px] px-4 py-3 bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-bl-[6px]">
                  <span className="inline-flex items-center gap-1.5 bg-primary-fixed/20 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full mb-2">
                    <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
                    {config.label}
                  </span>
                  <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
                  {msg.teacherNotified && (
                    <p className="mt-2 flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
                      <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                      Your teacher has been notified.
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-outline-variant/10">
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
              <div className="max-w-[80%] rounded-[24px] rounded-bl-[6px] px-4 py-3 bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="sticky bottom-0 bg-surface pt-2 pb-4">
          <div className="flex items-end gap-2 bg-surface-container-low rounded-[24px] border border-outline-variant/20 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedClassId ? "Ask your question..." : "Select a class to start asking..."}
              disabled={!selectedClassId || isLoading}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedClassId}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary disabled:opacity-40 transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="mt-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

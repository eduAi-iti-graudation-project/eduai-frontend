import { useRef, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/providers/use-auth"
import * as api from "@/lib/api"
import { useHomeworkHelpChat } from "@/hooks/use-homework-help"
import { FeedbackButtons } from "@/components/student/FeedbackButtons"
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
              value={selectedClassId}
              onValueChange={(value) => {
                setSelectedClassId(value)
                setSelectedAssignmentId("")
              }}
            >
              <SelectTrigger className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[170px]">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {studentClasses.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedAssignmentId}
              onValueChange={setSelectedAssignmentId}
              disabled={!selectedClassId}
            >
              <SelectTrigger className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface w-auto min-w-[200px] disabled:opacity-50">
                <SelectValue
                  placeholder={
                    selectedClassId
                      ? (studentClasses.data?.find((c) => c.id === selectedClassId)?.assignments.length ?? 0) > 0
                        ? "No specific assignment"
                        : "No assignments in this class"
                      : "Select a class first..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {studentClasses.data
                  ?.find((c) => c.id === selectedClassId)
                  ?.assignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </>
        }
      />

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
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedClassId}
              size="icon"
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary disabled:opacity-40 transition-opacity hover:opacity-90 hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </Button>
          </div>
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearMessages}
              className="mt-2 h-auto p-0 text-sm text-on-surface-variant hover:text-on-surface hover:bg-transparent transition-colors"
            >
              Clear chat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

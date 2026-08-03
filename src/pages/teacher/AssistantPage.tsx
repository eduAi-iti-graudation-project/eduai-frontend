import { useRef, useEffect, useState } from "react"
import { useClasses } from "@/hooks/use-classes"
import { useAssistantChat } from "@/hooks/use-assistant"
import { PageHeader } from "@/components/shared/PageHeader"
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

const NO_CLASS = "__none__"

export function AssistantPage() {
  const { classes } = useClasses()
  const [selectedClassId, setSelectedClassId] = useState("")
  const [input, setInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, sendMessage, clearMessages, isLoading } = useAssistantChat(selectedClassId || null)

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
        title="AI Assistant"
        actions={
          <div className="flex items-center gap-3">
            <Select
              value={selectedClassId}
              onValueChange={(v) => setSelectedClassId(v === NO_CLASS ? "" : v)}
            >
              <SelectTrigger className="w-auto rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface form-input-focus">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLASS}>Select a class...</SelectItem>
                {classes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearMessages}
                className="text-sm text-on-surface-variant hover:text-on-surface hover:bg-transparent h-auto px-2 py-1"
              >
                Clear chat
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="psychology"
              title="How can I help you?"
              description="Select a class and ask me anything — create quizzes, summarize materials, or get teaching suggestions."
            />
          </div>
        )}

        <div className="flex-1 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-[24px] px-4 py-3 ${msg.role === "user" ? "bg-primary text-on-primary rounded-br-[6px]" : "bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-bl-[6px]"}`}>
                <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
                <p className={`font-label-sm text-label-sm mt-1 ${msg.role === "user" ? "text-on-primary/60" : "text-on-surface-variant"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
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
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedClassId ? "Type your message..." : "Select a class to start chatting..."}
              disabled={!selectedClassId || isLoading}
              rows={1}
              className="flex-1 bg-transparent border-0 rounded-none shadow-none outline-none resize-none px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 min-h-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedClassId}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

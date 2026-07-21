import { useRef, useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { TopNavBar } from "@/components/layout/TopNavBar"
import { useClasses } from "@/hooks/use-classes"
import { useAssistantChat } from "@/hooks/use-assistant"

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
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNavBar />
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
          <h1 className="font-headline-lg text-headline-lg text-primary">AI Assistant</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="form-input-focus rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            >
              <option value="">Select a class...</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-md gap-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center ">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary mb-2">How can I help you?</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Select a class and ask me anything — create quizzes, summarize materials, or get teaching suggestions.
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[24px] px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-br-[6px]"
                      : "bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-bl-[6px]"
                  }`}
                >
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
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedClassId ? "Type your message..." : "Select a class to start chatting..."}
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
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

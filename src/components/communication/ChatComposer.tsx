import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChatRole = "TEACHER" | "STUDENT" | "GUARDIAN" | "ADMIN"

const SUGGESTIONS: Record<ChatRole, string[]> = {
  TEACHER: ["Any questions on the assignment?", "Thanks for reaching out!", "Can we catch up this week?"],
  STUDENT: ["Thanks for the feedback!", "I have a question about the due date.", "Got it — thanks!"],
  GUARDIAN: ["Can we schedule a quick call?", "Thanks for the update!", "How is my child doing this term?"],
  ADMIN: ["I can help with that.", "Let me check and get back to you.", "Thanks for letting us know."],
}

interface ChatComposerProps {
  onSend: (text: string) => void
  canSend: boolean
  connected: boolean
  role: ChatRole
}

export function ChatComposer({ onSend, canSend, connected, role }: ChatComposerProps) {
  const [draft, setDraft] = useState("")
  const ready = canSend && draft.trim().length > 0

  const handleSend = () => {
    if (!ready) return
    onSend(draft.trim().slice(0, 4000))
    setDraft("")
  }

  return (
    <div className="border-t border-outline-variant bg-surface-container-lowest p-3">
      <div className="max-w-3xl mx-auto w-full space-y-2">
        {draft.trim().length === 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {SUGGESTIONS[role].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="shrink-0 rounded-full border border-outline-variant bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-[20px] bg-surface-container px-md py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px] max-h-[160px]"
          />
          <Button
            onClick={handleSend}
            disabled={!ready}
            className={cn("h-[44px] w-[44px] p-0 rounded-full shrink-0")}
            title="Send"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </Button>
        </div>
        {!connected && (
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              Reconnecting… messages will send once connected.
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
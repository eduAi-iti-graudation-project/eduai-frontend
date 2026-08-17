import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/use-auth"
import { useMeetingChat } from "@/hooks/use-meeting-chat"
import type { MeetingMessage } from "@/lib/api"

function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export function ChatPanel({ meetingId, className }: { meetingId: string; className?: string }) {
 const { user } = useAuth()
 const { messages, send, initialLoading } = useMeetingChat(meetingId)
 const [text, setText] = useState("")
 const listRef = useRef<HTMLDivElement | null>(null)

 useEffect(() => {
  if (listRef.current) {
   listRef.current.scrollTop = listRef.current.scrollHeight
  }
 }, [messages.length])

 const submit = (event: React.FormEvent) => {
  event.preventDefault()
  const trimmed = text.trim()
  if (!trimmed) return
  void send.mutateAsync(trimmed).then(() => setText(""))
 }

 return (
  <div className={cn("flex flex-col h-full bg-surface-container-lowest", className)}>
   <div className="px-md py-sm border-b border-border flex items-center gap-2">
    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chat_bubble</span>
    <h2 className="font-label-lg text-label-lg text-primary">In-meeting chat</h2>
   </div>

   <div ref={listRef} className="flex-1 overflow-y-auto">
    <div className="p-md space-y-3">
     {initialLoading && (
      <p className="font-body-sm text-body-sm text-on-surface-variant">Loading messages…</p>
     )}
     {!initialLoading && messages.length === 0 && (
      <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-lg">
       No messages yet. Say hello!
      </p>
     )}
     {messages.map((message: MeetingMessage) => {
      const mine = message.userId === user?.id
      return (
       <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
        <div
         className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2",
          mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-surface-container-high text-on-surface rounded-bl-sm",
         )}
        >
         {!mine && (
          <p className="font-label-sm text-label-sm text-primary font-semibold mb-0.5">{message.name}</p>
         )}
         <p className="font-body-md text-body-md break-words">{message.text}</p>
         <p className={cn("font-label-xs text-label-xs mt-1", mine ? "text-white/70" : "text-on-surface-variant")}>
          {formatTime(message.createdAt)}
         </p>
        </div>
       </div>
      )
     })}
    </div>
   </div>

   <form onSubmit={submit} className="p-md border-t border-border flex gap-2">
    <Input
     value={text}
     onChange={(event) => setText(event.target.value)}
     placeholder="Type a message…"
     className="flex-1 text-on-surface"
    />
    <Button type="submit" size="sm" disabled={!text.trim() || send.isPending}>
     <span className="material-symbols-outlined text-[18px]">send</span>
    </Button>
   </form>
  </div>
 )
}

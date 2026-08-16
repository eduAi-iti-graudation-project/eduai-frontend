import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useChatThreads } from "@/hooks/use-chat-threads"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/api"

function getInitials(name: string): string {
 return name
  .split(" ")
  .map((word) => word[0])
  .join("")
  .toUpperCase()
  .slice(0, 2)
}

function formatMessageTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, {
  hour: "2-digit",
  minute: "2-digit",
 })
}

interface BubbleProps {
 message: ChatMessage
 mine: boolean
}

function Bubble({ message, mine }: BubbleProps) {
 return (
  <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
   <div
    className={cn(
     "max-w-[75%] px-md py-sm rounded-[20px] font-body-md text-body-md whitespace-pre-wrap break-words",
     mine
      ? "bg-primary text-primary-foreground rounded-br-md"
      : "bg-surface-container-high text-on-surface rounded-bl-md",
    )}
   >
    {message.text}
   </div>
   <div className="flex items-center gap-1 px-xs">
    <span className="font-label-sm text-label-sm text-on-surface-variant">
     {formatMessageTime(message.createdAt)}
    </span>
    {mine && message.readAt && (
     <span className="font-label-sm text-label-sm text-on-surface-variant">Seen</span>
    )}
   </div>
  </div>
 )
}

export function ChatThreadPage() {
 const { threadId } = useParams<{ threadId: string }>()
 const { user } = useAuth()
 const { data: threads, isLoading: threadsLoading } = useChatThreads()
 const { messages, connected, send, initialLoading } = useChatMessages(threadId, user?.id)
 const [draft, setDraft] = useState("")
 const bottomRef = useRef<HTMLDivElement>(null)

 const thread = threads?.find((t) => t.id === threadId)
 const basePath = user?.role === "TEACHER" ? "/chat" : "/student/chat"

 useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" })
 }, [messages.length])

 const canSend = !!threadId && draft.trim().length > 0 && !send.isPending

 const handleSend = () => {
  if (!canSend) return
  const text = draft.trim().slice(0, 4000)
  send.mutate(text)
  setDraft("")
 }

 if (threadsLoading && !thread) {
  return <LoadingState label="Loading conversation..." className="flex-1" />
 }

 if (!threadId || (!thread && !threadsLoading && threads && threads.length > 0)) {
  return (
   <EmptyState
    icon="chat_bubble"
    title="Conversation not found"
    description="This conversation doesn't exist or you don't have access to it."
    className="flex-1"
   />
  )
 }

 const peerName = thread?.peerName ?? "Chat"
 const className = thread?.className ?? ""

 return (
  <div className="flex flex-col h-full">
   <header className="flex items-center gap-3 px-md py-4 bg-surface-container-lowest border-b border-outline-variant">
    <Link
     to={basePath}
     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
    >
     <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
    </Link>
    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant font-label-md font-bold shrink-0">
     {getInitials(peerName)}
    </div>
    <div className="min-w-0">
     <h1 className="font-label-md text-label-md text-primary truncate">{peerName}</h1>
     <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
      {className || (connected ? "Online" : "Connecting...")}
     </p>
    </div>
   </header>

   {initialLoading && messages.length === 0 ? (
    <LoadingState label="Loading messages..." className="flex-1" />
   ) : messages.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-lg">
     <span className="material-symbols-outlined text-4xl text-on-surface-variant">chat_bubble</span>
     <p className="font-body-md text-body-md text-on-surface-variant text-center">
      No messages yet. Say hello!
     </p>
    </div>
   ) : (
    <div className="flex-1 overflow-y-auto p-md space-y-md">
     {messages.map((message) => (
      <Bubble key={message.id} message={message} mine={message.authorId === user?.id} />
     ))}
     <div ref={bottomRef} />
    </div>
   )}

   <footer className="border-t border-outline-variant bg-surface-container-lowest p-md mb-24 md:mb-0">
    <div className="flex items-end gap-2 max-w-3xl mx-auto w-full">
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
      placeholder="Type a message..."
      className="flex-1 resize-none rounded-full bg-surface-container-high px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] max-h-[160px]"
     />
     <Button
      onClick={handleSend}
      disabled={!canSend}
      className="h-[44px] w-[44px] p-0 rounded-lg shrink-0"
      title="Send"
     >
      <span className="material-symbols-outlined text-[20px]">send</span>
     </Button>
    </div>
    {!connected && (
     <p className="mt-xs text-center font-label-sm text-label-sm text-on-surface-variant">
      Reconnecting... messages will send once connected.
     </p>
    )}
   </footer>
  </div>
 )
}

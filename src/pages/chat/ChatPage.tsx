import { useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { useChatThreads } from "@/hooks/use-chat-threads"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useChatContext } from "@/hooks/use-chat-context"
import { ConversationList } from "@/components/communication/ConversationList"
import { ChatHeader } from "@/components/communication/ChatHeader"
import { ChatTimeline } from "@/components/communication/ChatTimeline"
import { ChatComposer } from "@/components/communication/ChatComposer"
import { ChatContextPanel } from "@/components/communication/ChatContextPanel"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { cn } from "@/lib/utils"
import type { ChatThreadListItem } from "@/lib/api"

function roleBasePath(role: string): string {
  switch (role) {
    case "TEACHER":
      return "/chat"
    case "STUDENT":
      return "/student/chat"
    case "GUARDIAN":
      return "/guardian/chat"
    default:
      return "/admin/chat"
  }
}

function roleSubtitle(role: string): string {
  switch (role) {
    case "TEACHER":
      return "Chat with your students"
    case "STUDENT":
      return "Chat with your teachers"
    case "GUARDIAN":
      return "Chat with the school"
    default:
      return "School conversations"
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const { user } = useAuth()
  const { data: threads, isLoading, isError, error, refetch } = useChatThreads()

  const role = user?.role ?? "ADMIN"
  const basePath = roleBasePath(role)
  const thread = threads?.find((t) => t.id === threadId)
  const context = useChatContext(thread, user)

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-md">
        <ErrorState
          title="Failed to load conversations"
          message={error?.message ?? "Something went wrong"}
          onRetry={() => refetch()}
          className="max-w-lg"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Inbox rail */}
      <div
        className={cn(
          "w-full md:w-[330px] lg:w-[350px] shrink-0 h-full",
          threadId ? "hidden md:flex" : "flex",
        )}
      >
        <ConversationList
          threads={threads ?? []}
          activeThreadId={threadId}
          basePath={basePath}
          isLoading={isLoading}
        />
      </div>

      {/* Thread pane */}
      <div
        className={cn(
          "flex-1 min-w-0 flex-col min-h-0 bg-surface",
          threadId ? "flex" : "hidden md:flex",
        )}
      >
        {!threadId ? (
          <PickConversation subtitle={roleSubtitle(role)} />
        ) : !thread && !isLoading ? (
          <PickConversation
            title="Conversation not found"
            subtitle="This conversation doesn't exist or you don't have access to it."
          />
        ) : !thread ? (
          <LoadingState label="Loading conversation…" className="flex-1" />
        ) : (
          <ThreadPane key={thread.id} thread={thread} basePath={basePath} />
        )}
      </div>

      {/* Role-aware context rail */}
      {threadId && thread && (
        <div className="hidden xl:flex w-[300px] shrink-0 border-l border-outline-variant bg-surface-container-lowest">
          <ChatContextPanel context={context} />
        </div>
      )}
    </div>
  )
}

function PickConversation({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-md">
      <div className="w-16 h-16 rounded-full bg-primary-fixed/40 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[34px] text-primary">forum</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-primary">{title ?? "Pick a conversation"}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-sm">
        {subtitle ?? "Select a conversation from the list to start chatting."}
      </p>
    </div>
  )
}

function ThreadPane({
  thread,
  basePath,
}: {
  thread: ChatThreadListItem
  basePath: string
}) {
  const { user } = useAuth()
  const { messages, connected, send, initialLoading } = useChatMessages(thread.id, user?.id)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const peerName = thread.peerName
  const subtitle = thread.className ?? (connected ? "Online" : "Connecting…")

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      <ChatHeader
        peerName={peerName}
        peerInitials={getInitials(peerName)}
        subtitle={subtitle}
        connected={connected}
        basePath={basePath}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        {initialLoading && messages.length === 0 ? (
          <LoadingState label="Loading messages…" className="py-lg" />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 p-lg text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">chat_bubble</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No messages yet. Say hello to {peerName}!
            </p>
          </div>
        ) : (
          <>
            <ChatTimeline messages={messages} myId={user?.id} peerName={peerName} peerInitials={getInitials(peerName)} />
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ChatComposer
        onSend={(text) => send.mutate(text)}
        canSend={!send.isPending}
        connected={connected}
        role={user?.role ?? "ADMIN"}
      />
    </div>
  )
}
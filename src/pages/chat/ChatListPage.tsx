import { Link } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { useChatThreads } from "@/hooks/use-chat-threads"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { cn } from "@/lib/utils"
import type { ChatThreadListItem } from "@/lib/api"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatChatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function ChatListPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = useChatThreads()

  const subtitle =
    user?.role === "TEACHER"
      ? "Chat with your students"
      : "Chat with your teachers"
  const basePath = user?.role === "TEACHER" ? "/chat" : "/student/chat"

  if (isError) {
    return (
      <ErrorState
        title="Failed to load conversations"
        message={error?.message ?? "Something went wrong"}
        onRetry={() => refetch()}
        className="flex-1"
      />
    )
  }

  return (
    <div className="p-xl max-w-3xl mx-auto w-full">
      <header className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Messages</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {isLoading ? "Loading..." : subtitle}
        </p>
      </header>

      {isLoading ? (
        <LoadingState className="py-lg" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="chat_bubble"
          title="No conversations yet"
          description="Start a conversation from a class page or students list."
        />
      ) : (
        <div className="space-y-3">
          {data.map((thread: ChatThreadListItem) => (
            <Link
              key={thread.id}
              to={`${basePath}/${thread.id}`}
              className={cn(
                "block bg-white rounded-[24px] p-md shadow-sm border border-outline-variant/10",
                "hover:border-primary/40 hover:shadow-md transition-all",
              )}
            >
              <div className="flex items-center gap-sm">
                <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-label-md font-bold shrink-0">
                  {getInitials(thread.peerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-label-md text-label-md text-on-surface truncate">
                      {thread.peerName}
                    </p>
                    {thread.lastMessage && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                        {formatChatTime(thread.updatedAt)}
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {thread.className ?? "Class"}
                    {thread.lastMessage ? ` · ${thread.lastMessage}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

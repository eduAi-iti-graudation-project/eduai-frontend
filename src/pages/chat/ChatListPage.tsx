import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuth } from "@/providers/use-auth"
import { useChatThreads } from "@/hooks/use-chat-threads"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import * as api from "@/lib/api"
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

function roleChatConfig(role: string | undefined): { subtitle: string; basePath: string } {
  switch (role) {
    case "ADMIN":
      return { subtitle: "Chat with teachers and guardians", basePath: "/admin/chat" }
    case "GUARDIAN":
      return { subtitle: "Chat with the school", basePath: "/guardian/chat" }
    case "TEACHER":
      return { subtitle: "Chat with your students", basePath: "/chat" }
    default:
      return { subtitle: "Chat with your teachers", basePath: "/student/chat" }
  }
}

export function ChatListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useChatThreads()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [peerFilter, setPeerFilter] = useState<"TEACHER" | "GUARDIAN">("TEACHER")

  const peers = useQuery({
    queryKey: ["chat-peers", peerFilter],
    queryFn: () => api.getUsers({ role: peerFilter, take: 200 }),
    enabled: pickerOpen && user?.role === "ADMIN",
  })

  const { subtitle, basePath } = roleChatConfig(user?.role)

  const startConversation = async (peer: api.AdminUser) => {
    try {
      const thread = await api.createOrGetAdminChatThread(peer.id, peer.role === "GUARDIAN" ? "GUARDIAN" : "TEACHER")
      setPickerOpen(false)
      navigate(`${basePath}/${thread.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start a conversation")
    }
  }

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

  const isAdmin = user?.role === "ADMIN"

  return (
    <div className="p-xl max-w-3xl mx-auto w-full">
      <header className="mb-lg border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-1">Messages</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {isLoading ? "Loading..." : subtitle}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setPickerOpen(true)} className="shrink-0">
              <span className="material-symbols-outlined text-[18px] mr-1.5">add_comment</span>
              New conversation
            </Button>
          )}
        </div>
      </header>

      {isLoading ? (
        <LoadingState className="py-lg" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="chat_bubble"
          title="No conversations yet"
          description={
            isAdmin
              ? "Start a conversation with a teacher or guardian."
              : "Start a conversation from a class page or students list."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((thread: ChatThreadListItem) => (
            <Link
              key={thread.id}
              to={`${basePath}/${thread.id}`}
              className={cn(
                "block bg-surface-container-lowest rounded-lg p-md border border-outline-variant",
                "hover:border-primary transition-colors group",
              )}
            >
              <div className="flex items-center gap-sm">
                <div className="w-11 h-11 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-label-md font-bold shrink-0">
                  {getInitials(thread.peerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate font-medium">
                        {thread.peerName}
                      </p>
                      {thread.type === "ADMIN" && (
                        <span className="inline-flex items-center font-label-sm text-label-sm px-1.5 py-0.5 rounded-md bg-primary-container text-on-primary-container shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    {thread.lastMessage && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                        {formatChatTime(thread.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {thread.className ?? "Class"}{thread.lastMessage ? ` · ${thread.lastMessage}` : ""}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground font-label-sm text-label-sm shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="rounded-lg max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-headline-md text-headline-md text-on-surface">
              New conversation
            </DialogTitle>
            <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
              Start a conversation with a teacher or guardian from your school.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={peerFilter === "TEACHER" ? "default" : "secondary"}
              onClick={() => setPeerFilter("TEACHER")}
              className="flex-1"
            >
              Teachers
            </Button>
            <Button
              type="button"
              variant={peerFilter === "GUARDIAN" ? "default" : "secondary"}
              onClick={() => setPeerFilter("GUARDIAN")}
              className="flex-1"
            >
              Guardians
            </Button>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1">
            {peers.isLoading ? (
              <LoadingState className="py-md" />
            ) : !peers.data || peers.data.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant py-md text-center">
                No {peerFilter.toLowerCase()}s in your school yet.
              </p>
            ) : (
              peers.data.map((peer) => (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => startConversation(peer)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-left"
                >
                  <Avatar className="h-8 w-8 rounded-full shrink-0">
                    <AvatarFallback className="bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md">
                      {getInitials(peer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface font-medium truncate">{peer.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{peer.email}</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

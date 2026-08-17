import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { ChatThreadListItem } from "@/lib/api"
import { LoadingState } from "@/components/shared/LoadingState"
import { cn } from "@/lib/utils"

export type ChatFilter = "all" | "unread" | "class"

const FILTERS: { value: ChatFilter; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "forum" },
  { value: "unread", label: "Unread", icon: "mark_email_unread" },
  { value: "class", label: "Classes", icon: "school" },
]

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
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function relativeGroup(iso: string): "today" | "week" | "earlier" {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return "today"
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  return date >= weekAgo ? "week" : "earlier"
}

const GROUP_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  earlier: "Earlier",
}

interface ConversationListProps {
  threads: ChatThreadListItem[]
  activeThreadId?: string
  basePath: string
  isLoading?: boolean
}

export function ConversationList({ threads, activeThreadId, basePath, isLoading }: ConversationListProps) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ChatFilter>("all")

  const totalUnread = useMemo(() => threads.reduce((sum, t) => sum + t.unreadCount, 0), [threads])
  const activeToday = useMemo(
    () => threads.filter((t) => new Date(t.updatedAt).toDateString() === new Date().toDateString()).length,
    [threads],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((t) => {
      if (filter === "unread" && t.unreadCount === 0) return false
      if (filter === "class" && !t.className) return false
      if (!q) return true
      return t.peerName.toLowerCase().includes(q) || (t.className ?? "").toLowerCase().includes(q)
    })
  }, [threads, filter, query])

  const grouped = useMemo(() => {
    const groups: { label: string; threads: ChatThreadListItem[] }[] = []
    if (filter === "all") {
      const unread = filtered.filter((t) => t.unreadCount > 0)
      const rest = filtered.filter((t) => t.unreadCount === 0)
      if (unread.length > 0) groups.push({ label: "Unread", threads: unread })
      for (const key of ["today", "week", "earlier"] as const) {
        const bucket = rest
          .filter((t) => relativeGroup(t.updatedAt) === key)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        if (bucket.length > 0) groups.push({ label: GROUP_LABELS[key], threads: bucket })
      }
    } else if (filter === "class") {
      const byClass = new Map<string, ChatThreadListItem[]>()
      for (const t of filtered) {
        const key = t.className ?? "Class"
        const existing = byClass.get(key) ?? []
        existing.push(t)
        byClass.set(key, existing)
      }
      for (const [name, list] of byClass) {
        groups.push({ label: name, threads: list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) })
      }
    } else {
      groups.push({
        label: "Conversations",
        threads: [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      })
    }
    return groups
  }, [filtered, filter])

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-container-lowest border-r border-outline-variant">
      <div className="p-3 border-b border-outline-variant space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-label-sm text-label-sm transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
              aria-pressed={filter === f.value}
            >
              <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
              {f.label}
              {f.value === "unread" && totalUnread > 0 ? (
                <span className={cn("tabular-nums", filter === f.value ? "text-primary-foreground" : "text-primary")}>
                  {totalUnread}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-3 py-2 rounded-md font-body-md text-body-md bg-surface-container outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md bg-surface-container px-2.5 py-1.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Conversations</span>
            <span className="font-label-md text-label-md text-on-surface tabular-nums font-semibold">{threads.length}</span>
          </div>
          <div className="rounded-md bg-surface-container px-2.5 py-1.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Active today</span>
            <span className="font-label-md text-label-md text-on-surface tabular-nums font-semibold">{activeToday}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <LoadingState label="Loading conversations…" className="py-lg" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-lg px-4">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2">forum</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {query || filter !== "all" ? "No conversations match." : "No conversations yet."}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Start one from a class page or the students list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/60">
            {grouped.map((group) => (
              <section key={group.label}>
                <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur px-3 py-1.5">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">{group.label}</p>
                </div>
                {group.threads.map((thread) => {
                  const active = thread.id === activeThreadId
                  return (
                    <Link
                      key={thread.id}
                      to={`${basePath}/${thread.id}`}
                      className={cn(
                        "block px-3 py-2.5 transition-colors",
                        active ? "bg-primary-container/40" : "hover:bg-surface-container-low",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-label-md font-bold",
                              active ? "bg-primary text-primary-foreground" : "bg-primary-fixed text-on-primary-fixed-variant",
                            )}
                          >
                            {getInitials(thread.peerName)}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest bg-success" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={cn("font-label-md text-label-md truncate", thread.unreadCount > 0 ? "text-on-surface font-semibold" : "text-on-surface")}>
                              {thread.peerName}
                            </p>
                            <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 tabular-nums">
                              {formatChatTime(thread.updatedAt)}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {thread.className ? `${thread.className} · ` : ""}
                            {thread.lastMessage ?? "No messages yet"}
                          </p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground font-label-sm text-label-sm tabular-nums font-semibold">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
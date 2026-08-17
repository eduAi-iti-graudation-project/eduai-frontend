import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ChatHistoryItem {
  id: string
  title: string | null
  lastMessage: string | null
  updatedAt: string
}

interface ChatHistorySidebarProps {
  conversations: ChatHistoryItem[]
  activeId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  retentionNote?: string
  className?: string
}

function relativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function ChatHistorySidebar({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onDelete,
  retentionNote,
  className,
}: ChatHistorySidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col w-60 shrink-0 border-r border-outline-variant bg-surface-container-low/50",
        className,
      )}
    >
      <div className="p-3">
        <Button
          type="button"
          onClick={onNew}
          className="w-full justify-start rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-label-md text-label-md h-auto px-3 py-2"
        >
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading && conversations.length === 0 ? (
          <p className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
            Loading chats…
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
            No past chats yet.
          </p>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId
            return (
              <div key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 pr-8 transition-colors",
                    active
                      ? "bg-primary-container/60 text-on-primary-container"
                      : "hover:bg-surface-container text-on-surface",
                  )}
                >
                  <p className="font-label-md text-label-md truncate">
                    {c.title || "New conversation"}
                  </p>
                  {c.lastMessage && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                      {c.lastMessage}
                    </p>
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-0.5">
                    {relativeTime(c.updatedAt)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(c.id)
                  }}
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-error-container hover:text-on-error-container transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            )
          })
        )}
      </div>

      {retentionNote && (
        <p className="px-3 py-2 border-t border-outline-variant font-label-sm text-label-sm text-on-surface-variant/70">
          {retentionNote}
        </p>
      )}
    </aside>
  )
}
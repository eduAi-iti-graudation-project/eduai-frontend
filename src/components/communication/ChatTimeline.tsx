import type { ChatMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ChatTimelineProps {
  messages: ChatMessage[]
  myId: string | undefined
  peerName: string
  peerInitials: string
}

interface MessageCluster {
  authorId: string
  messages: ChatMessage[]
}

function dayLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return "Today"
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

function groupByDay(messages: ChatMessage[]): { key: string; label: string; clusters: MessageCluster[] }[] {
  const days: { key: string; label: string; clusters: MessageCluster[] }[] = []
  for (const message of messages) {
    const key = new Date(message.createdAt).toDateString()
    let day = days[days.length - 1]
    if (!day || day.key !== key) {
      day = { key, label: dayLabel(message.createdAt), clusters: [] }
      days.push(day)
    }
    const lastCluster = day.clusters[day.clusters.length - 1]
    if (lastCluster && lastCluster.authorId === message.authorId) {
      lastCluster.messages.push(message)
    } else {
      day.clusters.push({ authorId: message.authorId, messages: [message] })
    }
  }
  return days
}

/**
 * Message timeline: day separators (Today/Yesterday/date), sender grouping
 * with peer avatar+name shown once per run, and Sent/Seen read receipts.
 */
export function ChatTimeline({ messages, myId, peerName, peerInitials }: ChatTimelineProps) {
  const days = groupByDay(messages)

  return (
    <div className="space-y-lg py-md px-md">
      {days.map((day) => (
        <section key={day.key} className="space-y-md">
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-outline-variant/60" />
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container rounded-full px-md py-0.5">
              {day.label}
            </span>
            <span className="flex-1 h-px bg-outline-variant/60" />
          </div>

          {day.clusters.map((cluster, i) => {
            const mine = cluster.authorId === myId
            return (
              <div key={`${cluster.authorId}-${i}`} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {!mine && i === 0 && (
                  <div className="flex items-center gap-2 mb-1 px-xs">
                    <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">
                      {peerInitials}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{peerName}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {cluster.messages.map((message, j) => (
                    <div key={message.id} className="flex flex-col gap-0.5">
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
                      <div className="flex items-center gap-1 px-sm">
                        {j === cluster.messages.length - 1 && (
                          <>
                            <span className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
                              {timeLabel(message.createdAt)}
                            </span>
                            {mine && (
                              <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                {message.readAt ? (
                                  <>
                                    <span className="material-symbols-outlined text-[13px] text-secondary">done_all</span>
                                    Seen
                                  </>
                                ) : (
                                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant">done</span>
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
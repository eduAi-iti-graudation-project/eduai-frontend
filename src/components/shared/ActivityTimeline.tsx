import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export type TimelineTone = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral"

export interface TimelineItem {
  id: string
  icon: string
  title: string
  description?: string
  timestamp?: string
  timeLabel?: string
  tone?: TimelineTone
  to?: string
}

const toneStyles: Record<TimelineTone, { dot: string; ring: string; icon: string }> = {
  primary: {
    dot: "bg-primary",
    ring: "bg-primary-fixed",
    icon: "text-primary",
  },
  secondary: {
    dot: "bg-secondary",
    ring: "bg-secondary-fixed",
    icon: "text-secondary",
  },
  success: {
    dot: "bg-success",
    ring: "bg-success-container",
    icon: "text-success",
  },
  warning: {
    dot: "bg-warning",
    ring: "bg-warning-container",
    icon: "text-warning",
  },
  danger: {
    dot: "bg-error",
    ring: "bg-error-container",
    icon: "text-error",
  },
  neutral: {
    dot: "bg-outline",
    ring: "bg-surface-container-high",
    icon: "text-on-surface-variant",
  },
}

function formatDefaultTime(timestamp?: string, timeLabel?: string): string {
  if (timeLabel) return timeLabel
  if (!timestamp) return ""
  const date = new Date(timestamp)
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

interface ActivityTimelineProps {
  items: TimelineItem[]
  className?: string
  emptyLabel?: string
  emptyIcon?: string
}

/**
 * Reusable vertical timeline. Renders a tone-colored rail with dot nodes and
 * timestamped events. Items may link to routes via `to`.
 *
 * Part of the "table philosophy" data-dense toolkit — used by the chat context
 * rail and available to dashboards/alerts/meetings pages.
 */
export function ActivityTimeline({ items, className, emptyLabel, emptyIcon }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-center py-md", className)}>
        <span className="material-symbols-outlined text-[28px] text-outline mb-1">{emptyIcon ?? "event_note"}</span>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{emptyLabel ?? "No recent activity"}</p>
      </div>
    )
  }

  return (
    <ol className={cn("relative pl-md", className)}>
      <span aria-hidden className="absolute left-[5px] top-2 bottom-2 w-px bg-outline-variant/70" />
      {items.map((item) => {
        const tone = toneStyles[item.tone ?? "neutral"]
        const content = (
          <div className="relative flex gap-3 group">
            <span
              aria-hidden
              className={cn(
                "absolute -left-md top-1 w-2.5 h-2.5 rounded-full ring-4 transition-transform",
                tone.dot,
                tone.ring,
                item.to ? "group-hover:scale-110" : "",
              )}
            />
            <div className="min-w-0 flex-1 pt-px">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-label-md text-label-md text-on-surface font-semibold truncate">{item.title}</p>
                {item.timestamp || item.timeLabel ? (
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0 tabular-nums">
                    {formatDefaultTime(item.timestamp, item.timeLabel)}
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{item.description}</p>
              ) : null}
            </div>
          </div>
        )

        return (
          <li key={item.id} className="relative">
            {item.to ? (
              <Link to={item.to} className="block rounded-md px-1 py-1.5 -mx-1 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start gap-2">
                  <span className={cn("material-symbols-outlined text-[18px] mt-0.5 shrink-0", tone.icon)}>{item.icon}</span>
                  <span className="min-w-0 flex-1">{content}</span>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-2 px-1 py-1.5">
                <span className={cn("material-symbols-outlined text-[18px] mt-0.5 shrink-0", tone.icon)}>{item.icon}</span>
                <div className="min-w-0 flex-1">{content}</div>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  title: string
  body: string
  createdAt: string
  read: boolean
  onMarkRead?: () => void
  onClick?: () => void
  className?: string
}

export function NotificationItem({
  title,
  body,
  createdAt,
  read,
  onMarkRead,
  onClick,
  className,
}: NotificationItemProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "w-full text-left tactile-card rounded-[24px] bg-surface-container-lowest p-4 flex items-start gap-4 border-outline-variant/10 shadow-none transition-all hover:shadow-sm cursor-pointer",
        !read && "border-l-4 border-l-primary",
        className,
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          read ? "bg-surface-container-low text-on-surface-variant" : "bg-primary-fixed/20 text-primary",
        )}
      >
        <span className="material-symbols-outlined text-[20px]">
          {read ? "notifications" : "notifications_active"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={cn("font-label-md text-label-md", read ? "text-on-surface" : "text-primary font-bold")}>
            {title}
          </p>
          {!read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{body}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>

      {!read && onMarkRead && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMarkRead()
          }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
          title="Mark as read"
          aria-label="Mark as read"
        >
          <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
        </button>
      )}
    </Card>
  )
}

import { useState } from "react"
import { useAuth } from "@/providers/use-auth"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "@/components/ui/NotificationItem"
import { NotificationDetailDialog } from "@/components/ui/NotificationDetailDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { toast } from "sonner"
import type { components } from "@/types/api-schema"

type NotificationDto = components["schemas"]["NotificationDto"]

export function NotificationsListPage() {
  const { user } = useAuth()
  const { notifications, isLoading, isError, error, markRead, refetch } = useNotifications(user?.id)
  const myNotifications = notifications.filter((n) => !user?.id || n.userId === user.id)
  const [selected, setSelected] = useState<NotificationDto | null>(null)

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Failed to load notifications</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            {error?.message ?? "Something went wrong"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-md py-sm bg-secondary-container text-white rounded-full font-label-md text-label-md shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const unreadCount = myNotifications.filter((n) => !n.readAt).length

  return (
    <div className="p-xl max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-xs">Notifications</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {isLoading ? "Loading..." : `${myNotifications.length} notification${myNotifications.length !== 1 ? "s" : ""}${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[24px] bg-surface-container-lowest p-4 border border-outline-variant/10 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-surface-container-high rounded-full" />
                  <div className="h-4 w-64 bg-surface-container-high rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : myNotifications.length === 0 ? (
        <EmptyState
          icon="notifications_off"
          title="No notifications yet"
          description="When you receive notifications, they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {myNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              body={n.body ?? ""}
              createdAt={n.createdAt}
              read={!!n.readAt}
              onClick={() => {
                if (!n.readAt) {
                  markRead.mutate(n.id, {
                    onError: () => toast.error("Failed to mark as read"),
                  })
                }
                setSelected(n)
              }}
              onMarkRead={() => {
                markRead.mutate(n.id, {
                  onError: () => toast.error("Failed to mark as read"),
                })
              }}
            />
          ))}
        </div>
      )}

      <NotificationDetailDialog notification={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

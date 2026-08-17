import { useState } from "react"
import { useAuth } from "@/providers/use-auth"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "@/components/ui/NotificationItem"
import { NotificationDetailDialog } from "@/components/ui/NotificationDetailDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { toast } from "sonner"
import type { components } from "@/types/api-schema"

type NotificationDto = components["schemas"]["NotificationDto"]

export function NotificationsListPage() {
 const { user } = useAuth()
 const { notifications, isLoading, isError, error, markRead, refetch } = useNotifications()
 const myNotifications = notifications.filter((n) => !user?.id || n.userId === user.id)
 const [selected, setSelected] = useState<NotificationDto | null>(null)

 if (isError) {
  return (
   <ErrorState
    title="Failed to load notifications"
    message={error?.message ?? "Something went wrong"}
    onRetry={() => refetch()}
    className="flex-1"
   />
  )
 }

 const unreadCount = myNotifications.filter((n) => !n.readAt).length

 return (
  <div className="p-xl max-w-3xl mx-auto">
   <header className="flex items-center justify-between mb-lg">
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary mb-1">Notifications</h1>
     <p className="font-body-md text-body-md text-on-surface-variant">
      {isLoading ? "Loading..." : `${myNotifications.length} notification${myNotifications.length !== 1 ? "s" : ""}${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
     </p>
    </div>
    {unreadCount > 0 && (
     <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground font-label-md text-label-md">
      <span className="material-symbols-outlined text-[16px]">mark_email_unread</span>
      {unreadCount} unread
     </span>
    )}
   </header>

   {isLoading ? (
    <LoadingState className="py-lg" />
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

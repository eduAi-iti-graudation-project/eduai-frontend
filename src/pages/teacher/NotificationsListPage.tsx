import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "@/components/ui/NotificationItem"
import { NotificationDetailDialog } from "@/components/ui/NotificationDetailDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { notificationTargetPath, isUserRole } from "@/lib/notification-routes"
import type { components } from "@/types/api-schema"

type NotificationDto = components["schemas"]["NotificationDto"]

type FilterTab = "all" | "unread" | "read"

export function NotificationsListPage() {
 const { user } = useAuth()
 const navigate = useNavigate()
 const { notifications, isLoading, isError, error, markRead, markAllRead, refetch } = useNotifications()
 const myNotifications = notifications.filter((n) => !user?.id || n.userId === user.id)
 const [selected, setSelected] = useState<NotificationDto | null>(null)
 const [tab, setTab] = useState<FilterTab>("all")

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
 const readCount = myNotifications.length - unreadCount

 const tabs: { key: FilterTab; label: string; count: number }[] = [
  { key: "all", label: "All", count: myNotifications.length },
  { key: "unread", label: "Unread", count: unreadCount },
  { key: "read", label: "Read", count: readCount },
 ]

 const visible =
  tab === "all" ? myNotifications : tab === "unread" ? myNotifications.filter((n) => !n.readAt) : myNotifications.filter((n) => n.readAt)

 const handleMarkAll = () => {
  const unreadIds = myNotifications.filter((n) => !n.readAt).map((n) => n.id)
  if (unreadIds.length === 0) return
  markAllRead.mutate(unreadIds, {
   onError: () => toast.error("Failed to mark all as read"),
  })
 }

 return (
  <div className="p-xl max-w-3xl mx-auto">
   <header className="flex items-center justify-between gap-3 mb-lg">
    <div>
     <h1 className="font-headline-xl text-headline-xl text-primary mb-1">Notifications</h1>
     <p className="font-body-md text-body-md text-on-surface-variant">
      {isLoading ? "Loading..." : `${myNotifications.length} notification${myNotifications.length !== 1 ? "s" : ""}${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
     </p>
    </div>
    {unreadCount > 0 && (
     <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAll}
      disabled={markAllRead.isPending}
      className="rounded-md shrink-0"
     >
      <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
      Mark all as read
     </Button>
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
    <>
     <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-surface-container-low w-fit">
      {tabs.map((t) => (
       <button
        key={t.key}
        type="button"
        onClick={() => setTab(t.key)}
        className={cn(
         "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors",
         tab === t.key
          ? "bg-primary text-primary-foreground font-semibold"
          : "text-on-surface-variant hover:text-on-surface",
        )}
       >
        {t.label}
        <span className={cn("text-xs tabular-nums", tab === t.key ? "text-primary-foreground/80" : "text-on-surface-variant")}>
         {t.count}
        </span>
       </button>
      ))}
     </div>

     {visible.length === 0 ? (
      <EmptyState
       icon="notifications_off"
       title="Nothing here"
       description={tab === "unread" ? "You're all caught up." : "No read notifications yet."}
      />
     ) : (
      <div className="space-y-3">
       {visible.map((n) => (
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
           const target = notificationTargetPath(n, isUserRole(user?.role) ? user.role : undefined)
           if (target) {
            navigate(target)
           } else {
            setSelected(n)
           }
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
    </>
   )}

   <NotificationDetailDialog notification={selected} onClose={() => setSelected(null)} />
  </div>
 )
}
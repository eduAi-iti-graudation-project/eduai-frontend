import { cn } from "@/lib/utils"
import type { components } from "@/types/api-schema"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"

type NotificationDto = components["schemas"]["NotificationDto"]

interface NotificationDetailDialogProps {
 notification: NotificationDto | null
 onClose: () => void
}

function prettyType(type: string) {
 return type.replace(/_/g, " ").toLowerCase()
}

export function NotificationDetailDialog({ notification, onClose }: NotificationDetailDialogProps) {
 if (!notification) return null

 return (
  <Dialog open={!!notification} onOpenChange={(next) => {
   if (!next) onClose()
  }}>
   <DialogContent
    className="rounded-lg max-w-2xl bg-popover max-h-[90vh] overflow-y-auto"
    aria-describedby="notification-detail-body"
   >
    <DialogHeader>
     <div className="flex items-start gap-sm">
      <span
       className={cn(
        "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
        notification.readAt ? "bg-surface-container-low text-on-surface-variant" : "bg-primary text-primary-foreground",
       )}
      >
       <span className="material-symbols-outlined text-[22px]">
        {notification.readAt ? "notifications" : "notifications_active"}
       </span>
      </span>
      <div className="flex-1 min-w-0">
       <DialogTitle className="font-headline-md text-headline-md text-on-surface leading-snug">
        {notification.title}
       </DialogTitle>
       <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
        {new Date(notification.createdAt).toLocaleString()}
       </p>
      </div>
     </div>
    </DialogHeader>

    <div id="notification-detail-body">
     {notification.body ? (
      <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap mb-lg">
       {notification.body}
      </p>
     ) : (
      <p className="font-body-md text-body-md text-on-surface-variant italic mb-lg">
       No additional details.
      </p>
     )}

     <div className="rounded-lg bg-surface-container-low p-md space-y-3">
      <div className="flex items-center justify-between">
       <span className="font-label-sm text-label-sm text-on-surface-variant">Type</span>
       <span className="font-label-md text-label-md text-on-surface capitalize">{prettyType(notification.type)}</span>
      </div>
      <div className="flex items-center justify-between">
       <span className="font-label-sm text-label-sm text-on-surface-variant">Channel</span>
       <span className="font-label-md text-label-md text-on-surface">{notification.channel}</span>
      </div>
      <div className="flex items-center justify-between">
       <span className="font-label-sm text-label-sm text-on-surface-variant">Sent</span>
       <span className="font-label-md text-label-md text-on-surface">{new Date(notification.createdAt).toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
       <span className="font-label-sm text-label-sm text-on-surface-variant">Status</span>
       <span className={cn("font-label-md text-label-md", notification.readAt ? "text-on-surface-variant" : "text-primary")}>
        {notification.readAt ? `Read ${new Date(notification.readAt).toLocaleString()}` : "Unread"}
       </span>
      </div>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 )
}

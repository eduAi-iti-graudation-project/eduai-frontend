import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AlertCardProps {
 type: string
 studentName?: string
 reason: string
 status: string
 createdAt: string
 onResolve?: () => void
 onDismiss?: () => void
 className?: string
}

const typeIcons: Record<string, string> = {
 ATTENDANCE: "person_off",
 GRADE: "trending_down",
 BEHAVIOR: "warning",
 CONCERN: "heart_plus",
 MISSING_SUBMISSION: "assignment_late",
}

const statusStyles: Record<string, string> = {
 NEW: "bg-primary text-primary-foreground border-0",
 ACKNOWLEDGED: "bg-surface-container-high text-on-surface border-0",
 RESOLVED: "bg-surface-container-high text-on-surface-variant border-0",
}

export function AlertCard({
 type,
 studentName,
 reason,
 status,
 createdAt,
 onResolve,
 onDismiss,
 className,
}: AlertCardProps) {
 return (
  <Card
   className={cn(
    "rounded-lg bg-surface-container-lowest p-4 flex items-start gap-4 shadow-none",
    className,
   )}
  >
   <div
    className={cn(
     "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
     status === "NEW" ? "bg-primary text-primary-foreground" : "bg-surface-container-low text-on-surface-variant",
    )}
   >
    <span className="material-symbols-outlined text-[20px]">
     {typeIcons[type] ?? "notifications_active"}
    </span>
   </div>

   <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
     <Badge
      variant="outline"
      className={cn(
       "font-label-sm text-label-sm px-2 py-0.5 rounded-md",
       statusStyles[status] ?? "bg-surface-container-low text-on-surface border-0",
      )}
     >
      {status}
     </Badge>
     <span className="font-label-sm text-label-sm text-on-surface-variant">
      {type.replace(/_/g, " ")}
     </span>
    </div>
    {studentName && (
     <p className="font-label-md text-label-md text-on-surface font-bold">{studentName}</p>
    )}
    <p className="font-body-md text-body-md text-on-surface">{reason}</p>
    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
     {new Date(createdAt).toLocaleString()}
    </p>

    {(onResolve || onDismiss) && status !== "RESOLVED" && (
     <div className="flex items-center gap-2 mt-3">
      {onResolve && (
       <button
        type="button"
        onClick={onResolve}
        className="px-3 py-1.5 bg-primary text-primary-foreground font-label-sm text-label-sm rounded-md hover:opacity-90 active:scale-95 transition-all"
       >
        Resolve
       </button>
      )}
      {onDismiss && (
       <button
        type="button"
        onClick={onDismiss}
        className="px-3 py-1.5 bg-surface-container text-on-surface-variant font-label-sm text-label-sm rounded-md hover:bg-surface-container-high transition-all"
       >
        Dismiss
       </button>
      )}
     </div>
    )}
   </div>
  </Card>
 )
}

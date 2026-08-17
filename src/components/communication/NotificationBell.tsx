import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/providers/use-auth"

export function NotificationBell() {
 const { user } = useAuth()
 const { notifications, markRead } = useNotifications()
 const [open, setOpen] = useState(false)
 const ref = useRef<HTMLDivElement>(null)
 const navigate = useNavigate()

 const unread = notifications.filter((n) => !n.readAt).length

 const notificationsPath =
  user?.role === "STUDENT"
   ? "/student/notifications"
   : user?.role === "GUARDIAN"
    ? "/guardian/notifications"
    : "/notifications"

 useEffect(() => {
  function handleClick(e: MouseEvent) {
   if (ref.current && !ref.current.contains(e.target as Node)) {
    setOpen(false)
   }
  }
  document.addEventListener("mousedown", handleClick)
  return () => document.removeEventListener("mousedown", handleClick)
 }, [])

 const recent = notifications.slice(0, 5)

 return (
  <div ref={ref} className="relative">
   <button
    onClick={() => setOpen(!open)}
    className="relative text-on-surface-variant hover:text-primary-container transition-colors rounded-lg p-1"
   >
    <span className="material-symbols-outlined">notifications</span>
    {unread > 0 && (
     <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-lg bg-primary text-[10px] text-white flex items-center justify-center font-bold">
      {unread > 9 ? "9+" : unread}
     </span>
    )}
   </button>

   {open && (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-lg shadow-card border border-border overflow-hidden z-50">
     <div className="p-3 border-b border-border">
      <p className="font-label-md text-label-md text-on-surface font-bold">Notifications</p>
     </div>

     <div className="max-h-80 overflow-y-auto">
      {recent.length === 0 ? (
       <div className="p-4 text-center">
        <p className="font-body-sm text-body-sm text-on-surface-variant">No notifications yet</p>
       </div>
      ) : (
       recent.map((n) => (
        <button
         key={n.id}
         onClick={() => {
          if (!n.readAt) markRead.mutate(n.id)
          navigate(notificationsPath)
          setOpen(false)
         }}
         className={`w-full text-left p-3 flex items-start gap-3 hover:bg-surface-container transition-colors ${!n.readAt ? "border-l-4 border-primary" : ""}`}
        >
         <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[16px] text-primary">notifications_active</span>
         </div>
         <div className="min-w-0 flex-1">
          <p className="font-label-sm text-label-sm text-on-surface truncate">{n.title}</p>
          {n.body && <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{n.body}</p>}
          <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
           {new Date(n.createdAt).toLocaleDateString()}
          </p>
         </div>
        </button>
       ))
      )}
     </div>

     <div className="p-2 border-t border-border">
      <button
       onClick={() => { navigate(notificationsPath); setOpen(false) }}
       className="w-full py-2 text-center font-label-sm text-label-sm text-primary hover:bg-surface-container rounded-lg transition-colors"
      >
       View All Notifications
      </button>
     </div>
    </div>
   )}
  </div>
 )
}

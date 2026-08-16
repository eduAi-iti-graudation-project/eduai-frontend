import { Link } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { useOrganization } from "@/hooks/use-organization"

const STATUS_CONFIG: Record<
 string,
 { title: string; message: string; icon: string; className: string }
> = {
 TRIALING: {
  title: "Free trial active",
  message: "Your 14-day free trial is in progress.",
  icon: "timer",
  className: "bg-primary-container/10 text-primary border-primary/20",
 },
 PAST_DUE: {
  title: "Payment is past due",
  message: "Your subscription is overdue — features may be limited until it's resolved.",
  icon: "error_outline",
  className: "bg-error-container/60 text-on-error-container border-error/30",
 },
 CANCELED: {
  title: "Subscription canceled",
  message: "Your subscription has ended. Renew it to keep full access.",
  icon: "cancel",
  className: "bg-error-container/60 text-on-error-container border-error/30",
 },
}

const NEEDS_BANNER = new Set(["TRIALING", "PAST_DUE", "CANCELED"])

export function SubscriptionBanner() {
 const { user } = useAuth()
 const { data: org } = useOrganization()

 if (!org || !NEEDS_BANNER.has(org.subscriptionStatus)) return null

 const config = STATUS_CONFIG[org.subscriptionStatus]
 const isAdmin = user?.role === "ADMIN"

 return (
  <div className={`px-md py-2.5 border-b flex items-center justify-between gap-4 ${config.className}`}>
   <div className="flex items-center gap-2 min-w-0">
    <span className="material-symbols-outlined text-[18px] shrink-0">{config.icon}</span>
    <p className="font-label-md text-label-md truncate">
     <span className="font-bold">{config.title}:</span> {config.message}
    </p>
   </div>
   {isAdmin ? (
    <Link
     to="/admin/billing"
     className="shrink-0 font-label-sm text-label-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
     Manage billing
    </Link>
   ) : (
    <span className="shrink-0 font-label-sm text-label-sm opacity-80">Contact your administrator</span>
   )}
  </div>
 )
}

import { useState } from "react"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { PLANS } from "@/lib/plans"
import { useAuth } from "@/providers/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"

interface UpgradeDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 requiredTier: string | null
}

const PLAN_TIERS: { id: api.PlanId; name: string; price: string; description: string; icon: string }[] = PLANS.map((plan) => ({
 id: plan.id,
 name: plan.name,
 price: `${plan.price}/mo`,
 description: plan.tagline,
 icon: plan.id === "enterprise" ? "domain" : plan.id === "pro" ? "auto_awesome" : "school",
}))

export function UpgradeDialog({ open, onOpenChange, requiredTier }: UpgradeDialogProps) {
 const { user } = useAuth()
 const { data: org } = useOrganization()
 const [loadingId, setLoadingId] = useState<api.PlanId | null>(null)

 const isAdmin = user?.role === "ADMIN"
 const orgStatus = org?.subscriptionStatus ?? "TRIALING"
 const isGrouped = Boolean(org?.groupId)
 const needsNewSubscription = orgStatus === "CANCELED" || orgStatus === "PAST_DUE" || requiredTier === null
 const isPaidActive = orgStatus === "ACTIVE"
 // WP5: a school in a group is billed by the group on Enterprise only.
 const tiers = isGrouped ? PLAN_TIERS.filter((plan) => plan.id === "enterprise") : PLAN_TIERS
 const currentTierIndex = org?.subscriptionTier
  ? PLAN_TIERS.findIndex((p) => p.id === org.subscriptionTier.toLowerCase())
  : -1

 const handleUpgrade = async (planId: api.PlanId) => {
  setLoadingId(planId)
  try {
   if (isPaidActive) {
    await api.changePlan(planId)
    const name = PLAN_TIERS.find((p) => p.id === planId)?.name
    toast.success(`Plan update scheduled — your organization is now on ${name}.`)
    onOpenChange(false)
   } else {
    const { url } = await api.createCheckoutSession(planId)
    window.location.assign(url)
   }
  } catch (err) {
   toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.")
  } finally {
   setLoadingId(null)
  }
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-md rounded-lg">
    <DialogHeader>
     <DialogTitle className="font-headline-md text-headline-md text-on-surface">
      {needsNewSubscription ? "Start your subscription" : "Upgrade required"}
     </DialogTitle>
     <DialogDescription className="text-on-surface-variant font-body-sm text-body-sm">
      {needsNewSubscription
       ? "Your organization needs an active subscription to continue using EduAI."
       : isGrouped
         ? `Your school is part of a group billed on the Enterprise plan${requiredTier ? ` (required for ${requiredTier})` : ""}.`
         : isPaidActive
           ? `This feature requires the ${requiredTier} plan or higher. Switch your plan below — changes take effect immediately.`
           : `This feature requires the ${requiredTier} plan or higher. Choose a plan below to upgrade instantly.`}
     </DialogDescription>
    </DialogHeader>

    {isAdmin ? (
     <div className="space-y-3">
      {tiers.map((plan) => {
       const requiredIndex = requiredTier ? PLAN_TIERS.findIndex((p) => p.id === requiredTier) : -1
       const planIndex = PLAN_TIERS.findIndex((p) => p.id === plan.id)
       const disabled =
        (requiredTier !== null && planIndex < requiredIndex) || (isPaidActive && planIndex <= currentTierIndex)
       return (
        <button
         key={plan.id}
         type="button"
         disabled={disabled || loadingId !== null}
         onClick={() => handleUpgrade(plan.id)}
         className="w-full flex items-center gap-4 rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:border-surface-container-highest disabled:hover:scale-100"
        >
         <span className="w-10 h-10 shrink-0 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[22px]">{plan.icon}</span>
         </span>
         <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-2">
           <span className="font-label-md text-label-md font-bold text-on-surface">{plan.name}</span>
           <span className="font-label-sm text-label-sm text-primary">{plan.price}</span>
          </span>
          <span className="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">{plan.description}</span>
         </span>
         <span className="material-symbols-outlined text-on-surface-variant">
          {loadingId === plan.id ? "progress_activity" : "arrow_forward"}
         </span>
        </button>
       )
      })}
      <p className="font-label-sm text-label-sm text-on-surface-variant">
       Checkout is handled securely by Stripe. You can manage your plan anytime in{" "}
       <a href="/admin/billing" className="text-primary font-bold underline underline-offset-2">Billing</a>.
      </p>
     </div>
    ) : (
     <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-body-md text-body-md text-on-surface-variant">
       Your organization&apos;s plan doesn&apos;t include this feature. Please ask an administrator to upgrade your subscription.
      </p>
     </div>
    )}

    <div className="flex justify-end">
     <Button
      variant="ghost"
      className="rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-primary"
      onClick={() => onOpenChange(false)}
     >
      Not now
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}
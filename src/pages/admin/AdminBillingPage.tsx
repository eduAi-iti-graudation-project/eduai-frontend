import { useState } from "react"
import { toast } from "sonner"
import * as api from "@/lib/api"
import { useOrganization } from "@/hooks/use-organization"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { InviteMemberDialog } from "@/components/billing/InviteMemberDialog"

const PLANS: {
  id: api.PlanId
  name: string
  price: string
  period: string
  tagline: string
  features: string[]
  tier: api.SubscriptionTier
}[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    period: "included with trial",
    tagline: "For individual teachers getting started.",
    features: ["Up to 50 seats", "Rubric builder", "AI grading assistant", "Teacher–student chat"],
    tier: "BASIC",
  },
  {
    id: "pro",
    name: "Pro",
    price: "Popular",
    period: "for growing schools",
    tagline: "Unlocks the full AI-powered classroom.",
    features: ["Everything in Basic", "Auto-generated quizzes", "Homework help", "Reports & analysis"],
    tier: "PRO",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "for institutions",
    tagline: "Deep insights and institutional controls.",
    features: ["Everything in Pro", "Advanced insights", "Priority support", "Dedicated onboarding"],
    tier: "ENTERPRISE",
  },
]

function tierLabel(tier: api.SubscriptionTier): string {
  return tier === "TRIAL" ? "Trial" : tier.charAt(0) + tier.slice(1).toLowerCase()
}

export function AdminBillingPage() {
  const { data: org, isLoading, isError, error, refetch } = useOrganization()
  const [atPeriodEnd, setAtPeriodEnd] = useState(false)
  const [busyAction, setBusyAction] = useState<api.PlanId | "portal" | null>(null)

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load billing information"}
        onRetry={() => refetch()}
      />
    )
  }

  if (isLoading || !org) {
    return <LoadingState label="Loading billing information..." />
  }

  const handleCheckout = async (planId: api.PlanId) => {
    if (org.subscriptionTier !== "TRIAL" && planId === "basic") return
    setBusyAction(planId)
    try {
      const res = await api.createCheckoutSession(planId)
      if (res.url) {
        window.location.assign(res.url)
      } else {
        toast.error("Checkout is not available right now. Please try again.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout")
    } finally {
      setBusyAction(null)
    }
  }

  const handlePortal = async () => {
    setBusyAction("portal")
    try {
      const res = await api.createBillingPortal()
      if (res.url) {
        window.location.assign(res.url)
      } else {
        toast.error("Billing portal is not available right now. Please try again.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal")
    } finally {
      setBusyAction(null)
    }
  }

  const handleChangePlan = async (planId: api.PlanId) => {
    setBusyAction(planId)
    try {
      await api.changePlan(planId, atPeriodEnd)
      toast.success(`Plan update scheduled — your organization is now on ${tierLabel(PLANS.find((p) => p.id === planId)!.tier)}.`)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change plan")
    } finally {
      setBusyAction(null)
    }
  }

  const isPaidActive = org.subscriptionStatus === "ACTIVE"

  return (
    <div className="flex-1 p-xl max-w-6xl mx-auto w-full space-y-md">
      {/* Current plan / status card */}
      <div className="rounded-lg bg-white border border-border p-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-primary">workspace_premium</span>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{org.name}</p>
              <h2 className="font-headline-md text-headline-md text-on-surface">Current plan: {tierLabel(org.subscriptionTier)}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Status: {org.subscriptionStatus.charAt(0) + org.subscriptionStatus.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="font-label-sm text-label-sm text-on-surface-variant">Seats used</p>
              <p className="font-headline-md text-headline-md text-on-surface">
                {org.userCount} <span className="font-body-md text-body-md text-on-surface-variant">/ {org.seatLimit ?? "∞"}</span>
              </p>
            </div>
            {isPaidActive && (
              <Button
                variant="outline"
                className="rounded-lg font-label-md text-label-md border border-border bg-white text-primary hover:bg-surface-container h-auto px-5 py-2.5"
                onClick={handlePortal}
                disabled={busyAction === "portal"}
              >
                {busyAction === "portal" ? "Opening..." : "Billing portal"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-md items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = org.subscriptionTier === plan.tier
          const canUpgrade = plan.tier === "ENTERPRISE" || plan.tier !== org.subscriptionTier
          const busy = busyAction === plan.id
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-lg p-6 border ${
                isCurrent
                  ? "bg-primary-container text-on-primary-container border-primary/30 shadow-lg"
                  : "bg-white border-border shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md">{plan.name}</h3>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1 font-label-sm text-label-sm text-primary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Current
                  </span>
                )}
              </div>
              <div className="mt-3">
                <span className="font-headline-xl text-headline-xl leading-none">{plan.price}</span>
                <p className={`font-label-sm text-label-sm mt-1 ${isCurrent ? "opacity-70" : "text-on-surface-variant"}`}>{plan.period}</p>
              </div>
              <p className={`font-body-md text-body-md mt-3 ${isCurrent ? "opacity-90" : "text-on-surface-variant"}`}>{plan.tagline}</p>
              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 font-body-md text-body-md">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-6 rounded-lg font-label-md text-label-md px-6 py-3 h-auto transition-all ${
                  isCurrent
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:scale-[1.01] hover:bg-primary/90 active:scale-95"
                }`}
                disabled={busy || (isPaidActive && !canUpgrade)}
                onClick={() => {
                  if (isPaidActive && plan.id !== "basic") handleChangePlan(plan.id)
                  else handleCheckout(plan.id)
                }}
              >
                {busy
                  ? "Processing..."
                  : isCurrent
                    ? "Current plan"
                    : isPaidActive
                      ? `Switch to ${plan.name}`
                      : plan.name === "Enterprise"
                        ? "Contact sales"
                        : `Choose ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Change-plan options for paid orgs */}
      {isPaidActive && (
        <div className="rounded-lg bg-white border border-border p-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">swap_horiz</span>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">Switch plans immediately or at period end</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Immediate switches are prorated; period-end switches take effect at the next billing cycle.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="font-label-md text-label-md text-on-surface-variant">Apply at period end</span>
            <Switch checked={atPeriodEnd} onCheckedChange={setAtPeriodEnd} />
          </label>
        </div>
      )}

      {/* Members */}
      <div className="rounded-lg bg-white border border-border p-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-primary">group_add</span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">Add members to your organization</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Invite a teacher or student by email. Seats are limited to {org.seatLimit ?? "unlimited"}.
            </p>
          </div>
        </div>
        <InviteMemberDialog organizationId={org.id} seatLimit={org.seatLimit} userCount={org.userCount} />
      </div>
    </div>
  )
}

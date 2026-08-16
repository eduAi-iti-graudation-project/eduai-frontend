import { useState } from "react"
import { Link } from "react-router-dom"
import { BackLink } from "@/components/shared/BackLink"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS, TRIAL, formatSeats, useStartCheckout, type PlanId } from "@/lib/plans"
import { useAuth } from "@/providers/use-auth"

type RowValue = "yes" | "no" | string

/** Which paid plans include each feature (trial unlocks everything for 14 days). */
const FEATURE_ROWS: { label: string; ids: PlanId[] }[] = [
  { label: "14-day full-access trial", ids: ["basic", "pro", "enterprise"] },
  { label: "AI grading & per-criterion feedback", ids: ["basic", "pro", "enterprise"] },
  { label: "Curriculum materials & AI search", ids: ["basic", "pro", "enterprise"] },
  { label: "Attendance tracking & import", ids: ["basic", "pro", "enterprise"] },
  { label: "Struggle-signal alerts & guardian notifications", ids: ["basic", "pro", "enterprise"] },
  { label: "AI assistant, chat & homework help", ids: ["pro", "enterprise"] },
  { label: "AI quiz generation, grading & anti-cheat", ids: ["pro", "enterprise"] },
  { label: "Three-tier automated reports", ids: ["pro", "enterprise"] },
  { label: "Labs & study lab", ids: ["pro", "enterprise"] },
  { label: "Advanced dashboard insights & analytics", ids: ["enterprise"] },
  { label: "Dedicated support & onboarding", ids: ["enterprise"] },
]

function Cell({ value }: { value: RowValue }) {
  if (value === "yes")
    return (
      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
        check
      </span>
    )
  if (value === "no")
    return <span className="material-symbols-outlined text-outline-variant opacity-60">remove</span>
  return <span className="font-body-sm text-body-sm text-on-surface-variant">{value}</span>
}

function PaidPlanCard({ plan, onBuy }: { plan: (typeof PLANS)[number]; onBuy: (id: PlanId) => void }) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      await onBuy(plan.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border p-lg shadow-sm ${
        plan.featured ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-surface-container-lowest text-on-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-label-md text-label-md tracking-[0.16em] uppercase opacity-80">{plan.name}</p>
        {plan.featured && <span className="rounded-full bg-white/25 px-3 py-1 font-label-sm text-label-sm">Most popular</span>}
      </div>
      <p className="mt-md flex items-baseline gap-1">
        <span className="font-headline-xl text-headline-xl leading-none">{plan.price}</span>
        <span className="font-body-sm text-body-sm opacity-75">{plan.period}</span>
      </p>
      <p className="mt-1 font-body-sm text-body-sm opacity-80">{formatSeats(plan.seats)}</p>
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className={`mt-lg inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-label-md text-label-md transition-colors ${
          plan.featured
            ? "bg-white text-primary hover:bg-white/90 disabled:opacity-60"
            : "bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60"
        }`}
      >
        {busy && <span className="material-symbols-outlined text-[16px]">progress_activity</span>}
        {busy ? "Redirecting to Stripe..." : plan.cta}
      </button>
    </div>
  )
}

export function PricingPage() {
  const { user } = useAuth()
  const startCheckout = useStartCheckout()

  return (
    <div className="mx-auto w-full max-w-6xl p-xl">
      <BackLink to="/" label="Back to home" className="mb-md" />
      <header className="mb-lg text-center">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Pricing that grows with your school</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
          Every plan starts with a 14-day trial that unlocks everything. Pick Basic to get started, scale to Pro, or talk to us
          about the district-wide controls in Enterprise.
        </p>
      </header>

      {/* plan cards */}
      <div className="mb-xl grid grid-cols-1 gap-lg sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col rounded-2xl border border-border bg-surface-container-lowest p-lg text-on-surface shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-label-md text-label-md tracking-[0.16em] uppercase opacity-80">{TRIAL.name}</p>
          </div>
          <p className="mt-md flex items-baseline gap-1">
            <span className="font-headline-xl text-headline-xl leading-none">{TRIAL.price}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{TRIAL.period}</span>
          </p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{formatSeats(TRIAL.seats)}</p>
          <Link
            to={TRIAL.to}
            className="mt-lg inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-label-md text-label-md text-primary-foreground transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            {TRIAL.cta}
          </Link>
        </div>
        {PLANS.map((plan) => (
          <PaidPlanCard key={plan.id} plan={plan} onBuy={startCheckout} />
        ))}
      </div>

      {/* full comparison */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-label-xl text-label-xl text-on-surface">Compare the tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border font-label-md text-label-md text-on-surface-variant">
                  <th className="py-3 pr-4 font-normal">Feature</th>
                  <th className="py-3 px-4 font-normal text-center">Trial</th>
                  <th className="py-3 px-4 font-normal text-center">Basic</th>
                  <th className="py-3 px-4 font-normal text-center">Pro</th>
                  <th className="py-3 px-4 font-normal text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 text-on-surface">{row.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value="yes" />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.ids.includes("basic") ? "yes" : "no"} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.ids.includes("pro") ? "yes" : "no"} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.ids.includes("enterprise") ? "yes" : "no"} />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 text-on-surface">Seats</td>
                  <td className="px-4 py-2.5 text-center font-body-sm text-body-sm text-on-surface-variant">{formatSeats(TRIAL.seats)}</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="px-4 py-2.5 text-center font-body-sm text-body-sm text-on-surface-variant">
                      {formatSeats(plan.seats)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        {user?.role === "ADMIN" ? (
          <>Manage or change your plan from the <Link to="/admin/billing" className="text-primary hover:underline">Billing</Link> page.</>
        ) : (
          <>
            Questions? Email{" "}
            <a href="mailto:sales@eduai.app" className="text-primary hover:underline">
              sales@eduai.app
            </a>
          </>
        )}
      </p>
    </div>
  )
}
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TIERS = [
  { name: "Trial", price: "Free", period: "14 days · no card required", featured: false, cta: "Start free — for teachers", to: "/signup" },
  { name: "Pro", price: "$15", period: "per month · per school", featured: true, cta: "Get Pro now", to: "/signup" },
  { name: "Enterprise", price: "$30", period: "per month · for districts", featured: false, cta: "Contact sales", to: "mailto:sales@eduai.app" },
]

type RowValue = "yes" | "no" | string

const ROWS: { label: string; trial: RowValue; pro: RowValue; ent: RowValue }[] = [
  { label: "14-day full-access trial", trial: "yes", pro: "yes", ent: "yes" },
  { label: "AI grading assistant", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Rubric builder", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Teacher–student chat", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Homework help", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Auto-generated quizzes", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Guardian progress updates", trial: "yes", pro: "yes", ent: "yes" },
  { label: "Seats", trial: "50 seats", pro: "Unlimited", ent: "Unlimited" },
  { label: "Advanced reports & analysis", trial: "no", pro: "yes", ent: "yes" },
  { label: "Advanced insights & analytics", trial: "no", pro: "no", ent: "yes" },
  { label: "District-wide admin controls", trial: "no", pro: "no", ent: "yes" },
  { label: "Dedicated onboarding", trial: "no", pro: "no", ent: "yes" },
  { label: "Priority support", trial: "no", pro: "no", ent: "yes" },
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

function PlanLink({ to, children, featured }: { to: string; children: React.ReactNode; featured?: boolean }) {
  const cls = `inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-label-md text-label-md transition-colors ${
    featured
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-primary text-primary-foreground hover:bg-primary-container hover:text-on-primary-container"
  }`
  return to.startsWith("mailto:") ? (
    <a href={to} className={cls}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}

export function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-xl">
      <Link to="/" className="font-label-md text-label-md text-primary hover:underline mb-md inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to home
      </Link>
      <header className="mb-lg text-center">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Pricing that grows with your school</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
          Every plan starts with a 14-day trial that unlocks everything. Pick Pro when you are ready to scale, or talk to us
          about the district-wide controls in Enterprise.
        </p>
      </header>

      {/* plan cards */}
      <div className="mb-xl grid grid-cols-1 gap-lg md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border p-lg shadow-sm ${
              t.featured ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-surface-container-lowest text-on-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-label-md text-label-md tracking-[0.16em] uppercase opacity-80">{t.name}</p>
              {t.featured && <span className="rounded-full bg-white/25 px-3 py-1 font-label-sm text-label-sm">Most popular</span>}
            </div>
            <p className="mt-md flex items-baseline gap-1">
              <span className="font-headline-xl text-headline-xl leading-none">{t.price}</span>
              <span className="font-body-sm text-body-sm opacity-75">{t.period}</span>
            </p>
            <PlanLink to={t.to} featured={t.featured}>
              {t.cta}
            </PlanLink>
          </div>
        ))}
      </div>

      {/* full comparison */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-label-xl text-label-xl text-on-surface">Compare the tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border font-label-md text-label-md text-on-surface-variant">
                  <th className="py-3 pr-4 font-normal">Feature</th>
                  <th className="py-3 px-4 font-normal text-center">Trial</th>
                  <th className="py-3 px-4 font-normal text-center">Pro</th>
                  <th className="py-3 px-4 font-normal text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 text-on-surface">{row.label}</td>
                    <td className="px-4 py-2.5 text-center"><Cell value={row.trial} /></td>
                    <td className="px-4 py-2.5 text-center"><Cell value={row.pro} /></td>
                    <td className="px-4 py-2.5 text-center"><Cell value={row.ent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
        Questions? Email{" "}
        <a href="mailto:sales@eduai.app" className="text-primary hover:underline">
          sales@eduai.app
        </a>
      </p>
    </div>
  )
}
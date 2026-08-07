import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import heroImg from "@/assets/hero.png"

const features = [
  {
    icon: "grading",
    chip: "bg-primary text-primary-foreground",
    title: "AI Grading",
    description:
      "Automate repetitive grading tasks with intelligent rubrics and instant feedback generation.",
  },
  {
    icon: "warning",
    chip: "bg-primary text-primary-foreground",
    title: "Struggle Alerts",
    description:
      "Proactively identify students who are falling behind based on predictive learning models.",
  },
  {
    icon: "forum",
    chip: "bg-primary text-primary-foreground",
    title: "Classroom Chat",
    description:
      "Secure, moderated communication channels for students and teachers to collaborate seamlessly.",
  },
  {
    icon: "quiz",
    chip: "bg-primary text-primary-foreground",
    title: "AI Quiz Engine",
    description:
      "Generate customized quizzes and assessments instantly from your course materials.",
  },
  {
    icon: "insights",
    chip: "bg-primary text-primary-foreground",
    title: "Deep Insights",
    description:
      "Comprehensive analytics dashboards tracking cohort performance and individual growth.",
  },
  {
    icon: "assignment",
    chip: "bg-primary text-primary-foreground",
    title: "Submissions",
    description:
      "A centralized hub for collecting, reviewing, and returning student assignments.",
  },
]

const plans = [
  {
    id: "basic",
    name: "Basic",
    tagline: "For individual educators.",
    price: "$0",
    highlighted: false,
    features: [
      { label: "Up to 3 classes", included: true },
      { label: "Basic AI grading", included: true },
      { label: "Advanced analytics", included: false },
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For departments and small schools.",
    price: "$49",
    highlighted: true,
    features: [
      { label: "Unlimited classes", included: true },
      { label: "Full AI suite", included: true },
      { label: "Advanced analytics", included: true },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For entire school districts.",
    price: "Custom",
    highlighted: false,
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Custom integrations", included: true },
      { label: "Dedicated support", included: true },
    ],
    cta: "Contact Sales",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-gutter">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="font-headline-sm text-headline-sm text-primary">EduAI</span>
        </div>
        <div className="hidden md:flex items-center gap-lg">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-md">
          <Button asChild variant="outline" className="rounded-lg px-4 py-2 h-auto text-on-surface-variant hover:text-primary">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-lg px-4 py-2 h-auto">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
      </nav>

      {/* Hero Section */}
      <section className="px-gutter py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-headline-xl tracking-tight text-on-surface">
              AI-driven school management for the modern era
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-lg">Streamline grading, engage students, and uncover deep insights with our comprehensive AI-powered platform.</p>
            <div className="mt-lg">
              <Button asChild className="rounded-lg px-8 py-3 h-auto text-body-lg font-label-md">
                <Link to="/signup">Start free trial</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
            <img className="w-full h-auto object-cover opacity-90" alt="EduAI dashboard preview" src={heroImg} />
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-24 bg-surface-container-low px-gutter" id="features">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-headline-lg tracking-tight text-on-surface">Simplify grading, empower every learner</h2>
            <p className="text-body-lg text-on-surface-variant mt-md mb-md">Powerful AI tools for every part of your classroom workflow.</p>
            <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-lg">
              {features.map((f) => (
                <div key={f.title} className="flex flex-col items-center gap-3 text-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${f.chip}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">{f.title}</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-24 px-gutter" id="pricing">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-headline-lg tracking-tight text-on-surface">Simple, transparent pricing</h2>
          <p className="text-body-lg text-on-surface-variant mb-lg mt-md">Choose the plan that fits your institution's needs.</p>
          <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col gap-6 rounded-lg border bg-surface p-8 text-left shadow-sm ${plan.highlighted ? "border-primary" : "border-outline-variant"}`}
              >
                <div>
                  <h3 className="text-headline-lg font-headline-sm text-on-surface">{plan.name}</h3>
                  <p className="mt-1 text-body-md font-body-md text-on-surface-variant">{plan.tagline}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-headline-lg tracking-tight text-on-surface">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-body-md font-body-md text-on-surface-variant">/month</span>}
                </div>
                <ul className="grow space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-sm ${feature.included ? "text-primary" : "text-outline"}`}
                        style={{ fontVariationSettings: feature.included ? "'FILL' 1" : undefined }}
                      >
                        {feature.included ? "check" : "close"}
                      </span>
                      <span className={`text-body-md font-body-md ${feature.included ? "text-on-surface" : "text-on-surface-variant"}`}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full rounded-lg px-6 py-2 h-auto font-label-md"
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary text-on-primary">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-headline-lg tracking-tight">Ready to transform your classroom?</h2>
          <p className="text-body-lg mx-auto mt-4 max-w-2xl text-primary-fixed-dim opacity-90">Join thousands of educators saving hours every week with EduAI.</p>
          <Button
            asChild
            className="mt-lg rounded-lg bg-surface px-8 py-3 h-auto text-primary hover:bg-surface-container font-label-md"
          >
            <Link to="/signup">Join EduAI today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/50 bg-surface py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-gutter sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">EduAI</span>
          </div>
          <p className="text-body-sm font-body-md text-on-surface-variant">Smart AI tools for modern classrooms.</p>
          <div className="flex gap-6">
            <Link to="/login" className="font-label-md text-label-md text-on-surface-variant hover:text-primary">Privacy Policy</Link>
            <Link to="/login" className="font-label-md text-label-md text-on-surface-variant hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
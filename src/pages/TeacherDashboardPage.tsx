import { Link } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"

interface ClassData {
  id: string
  icon: string
  iconBg: string
  iconColor: string
  name: string
  section: string
  students: number
  pending: number
  pendingBg: string
  trend: string
  time?: string
  completion?: string
  alerts?: number
}

interface AlertData {
  id: string
  type: "ai" | "missed" | "flagged"
  title: string
  subtitle?: string
  description: string
  highlight?: string
  highlightAfter?: string
  actions?: { label: string; variant: "primary" | "outline" }[]
}

const classes: ClassData[] = [
  { id: "1", icon: "calculate", iconBg: "bg-primary-container/10", iconColor: "text-primary", name: "Grade 10 Math", section: "Section B", students: 28, pending: 12, pendingBg: "bg-secondary-container text-on-secondary-container", trend: "+25" },
  { id: "2", icon: "menu_book", iconBg: "bg-tertiary-fixed", iconColor: "text-on-tertiary-fixed", name: "Grade 9 English", section: "Section A", students: 32, pending: 5, pendingBg: "bg-secondary-container text-on-secondary-container", trend: "+29" },
  { id: "3", icon: "science", iconBg: "bg-secondary-fixed", iconColor: "text-on-secondary-fixed", name: "Grade 11 Physics", section: "Section C", students: 24, pending: 0, pendingBg: "bg-surface-container-high text-on-surface-variant", trend: "+21" },
]

const alerts: AlertData[] = [
  {
    id: "1", type: "ai", title: "Sara is falling behind",
    description: "Performance in",
    highlight: "Fractions",
    highlightAfter: "has dropped 15% in the last 3 quizzes.",
    actions: [
      { label: "View Trend", variant: "primary" },
      { label: "Nudge", variant: "outline" },
    ],
  },
  {
    id: "2", type: "missed", title: "Marcus Chen", subtitle: "Missed Assignment",
    description: '"The Great Gatsby" essay was due yesterday. No submission yet.',
    actions: [{ label: "Contact Student", variant: "outline" }],
  },
  {
    id: "3", type: "flagged", title: "Elena Rodriguez", subtitle: "Submission Flagged",
    description: 'High plagiarism score detected in "Cells Lab Report" (72% match).',
    actions: [{ label: "Review Score", variant: "primary" }],
  },
  {
    id: "4", type: "ai", title: "Class-wide Pattern",
    description: "65% of Grade 10 Math struggled with",
    highlight: "Question 4",
    highlightAfter: "on Homework 3.",
    actions: [{ label: "Generate Review Material", variant: "primary" }],
  },
]

function ClassCard({ data }: { data: ClassData }) {
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className={`${data.pendingBg} text-label-sm px-3 py-1 rounded-full font-bold`}>
          {data.pending} Pending
        </span>
      </div>
      <div className={`w-12 h-12 rounded-lg ${data.iconBg} ${data.iconColor} flex items-center justify-center mb-md`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{data.icon}</span>
      </div>
      <h4 className="font-headline-md text-headline-md mb-xs">{data.name}</h4>
      <p className="text-on-surface-variant font-body-md mb-lg">{data.section} &bull; {data.students} Students</p>
      <div className="flex items-center justify-between pt-md border-t border-outline-variant/10">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high" />
          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high" />
          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high" />
          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">{data.trend}</div>
        </div>
        <Link
          to={`/classes/${data.id}`}
          className="bg-primary text-white px-md py-base rounded-full font-label-md hover:opacity-90 active:scale-95 transition-all"
        >
          Open Class
        </Link>
      </div>
    </div>
  )
}

function AiAlertCard({ data, index }: { data: AlertData; index: number }) {
  const isSara = index === 0
  return (
    <div className="border border-dashed border-primary bg-primary/5 p-md rounded-xl relative group">
      <div className="flex justify-between items-start mb-base">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
          <span className="text-primary font-label-sm uppercase tracking-wider">AI Insight</span>
        </div>
        <button type="button" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>
      </div>
      <h5 className="font-label-md text-on-surface mb-xs">{data.title}</h5>
      <p className="font-body-md text-on-surface-variant text-sm mb-md">
        {data.description}{data.highlight && <span className="font-bold text-on-surface"> {data.highlight}</span>}{data.highlightAfter}
      </p>
      <div className={`flex ${isSara ? "gap-xs" : ""}`}>
        {data.actions?.map((action) => (
          <button
            key={action.label}
            type="button"
            className={
              action.variant === "primary"
                ? "flex-1 bg-primary text-white py-1.5 rounded-full text-label-sm font-bold hover:opacity-90"
                : "flex-1 border border-primary text-primary py-1.5 rounded-full text-label-sm font-bold hover:bg-primary/5 transition-colors"
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StandardAlertCard({ data }: { data: AlertData }) {
  const isFlagged = data.type === "flagged"
  return (
    <div className="border border-outline-variant/20 bg-white p-md rounded-xl">
      <div className="flex items-center gap-sm mb-base">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[12px] font-bold">
          {data.title.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h5 className="font-label-md text-on-surface">{data.title}</h5>
          <p className="text-[11px] text-outline">{data.subtitle}</p>
        </div>
      </div>
      <p className="font-body-md text-on-surface-variant text-sm mb-md">{data.description}</p>
      <button
        type="button"
        className={`w-full py-1.5 rounded-full text-label-sm font-bold transition-colors ${
          isFlagged
            ? "bg-secondary-container text-on-secondary-container hover:opacity-90"
            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
        }`}
      >
        {data.actions?.[0]?.label}
      </button>
    </div>
  )
}

export function TeacherDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex justify-between items-center w-full px-margin-desktop py-base max-w-full bg-surface-bright z-10">
          <div className="flex items-center gap-md">
            <h2 className="font-headline-lg text-headline-lg font-bold text-primary">Dashboard</h2>
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary w-64 transition-all"
                placeholder="Search students, classes..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-base">
              <button type="button" className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button type="button" className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-outline-variant/20 bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-margin-desktop">
          <div className="flex flex-col lg:flex-row gap-gutter">
            {/* Left: Class Cards + Weekly Recap */}
            <div className="flex-1">
              {/* Active Classes */}
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-headline-md text-on-surface">Active Classes</h3>
                <Link to="/classes" className="text-primary font-label-md hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-md">
                {classes.map((c) => (
                  <ClassCard key={c.id} data={c} />
                ))}
                {/* Add Class */}
                <div className="bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-high transition-all group">
                  <div className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-outline group-hover:border-primary group-hover:text-primary transition-all mb-sm">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface-variant group-hover:text-primary transition-all">Add Class</h4>
                  <p className="text-on-surface-variant font-label-sm max-w-[120px]">Create a new section or import from SIS</p>
                </div>
              </div>

              {/* Weekly Recap */}
              <div className="mt-lg">
                <div className="bg-primary/5 rounded-2xl p-lg border border-outline-variant/20 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-headline-md text-headline-md text-primary mb-sm">Weekly Recap</h3>
                    <p className="font-body-md text-on-surface-variant  mb-md">
                      Your students have completed 84% of their assignments this week. That&apos;s a 5% increase from last week!
                    </p>
                    <div className="flex gap-md">
                      <div className="bg-white p-sm rounded-xl border border-outline-variant/20 flex flex-col">
                        <span className="text-label-sm text-outline">Submission Rate</span>
                        <span className="font-headline-md text-headline-md text-primary">84.2%</span>
                      </div>
                      <div className="bg-white p-sm rounded-xl border border-outline-variant/20 flex flex-col">
                        <span className="text-label-sm text-outline">Avg. Grade</span>
                        <span className="font-headline-md text-headline-md text-secondary">B+</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[160px] text-primary">insights</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Needs Attention */}
            <div className="w-full lg:w-80 flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">Needs Attention</h3>
                <span className="bg-error-container text-on-error-container text-label-sm px-2 py-0.5 rounded-full font-bold">4</span>
              </div>
              <div className="flex flex-col gap-sm">
                {alerts.map((alert, i) =>
                  alert.type === "ai" ? (
                    <AiAlertCard key={alert.id} data={alert} index={i} />
                  ) : (
                    <StandardAlertCard key={alert.id} data={alert} />
                  )
                )}
              </div>
              {/* Tip */}
              <div className="mt-auto bg-surface-container-low p-md rounded-xl border border-outline-variant/30">
                <div className="flex items-center gap-sm mb-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">tips_and_updates</span>
                  <h6 className="font-label-md text-primary">Did you know?</h6>
                </div>
                <p className="text-[12px] text-on-surface-variant">Adding feedback within 24 hours increases student engagement by up to 30%.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}

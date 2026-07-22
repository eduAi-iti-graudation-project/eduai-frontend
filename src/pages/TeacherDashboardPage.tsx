import { Link } from "react-router-dom"
import { useDashboardData } from "@/hooks/use-dashboard-data"

const iconOptions = [
  { icon: "calculate", bg: "bg-primary-container/10", color: "text-primary" },
  { icon: "menu_book", bg: "bg-tertiary-fixed", color: "text-on-tertiary-fixed" },
  { icon: "science", bg: "bg-secondary-fixed", color: "text-on-secondary-fixed" },
  { icon: "history_edu", bg: "bg-primary-container/10", color: "text-primary" },
  { icon: "language", bg: "bg-tertiary-fixed", color: "text-on-tertiary-fixed" },
  { icon: "palette", bg: "bg-secondary-fixed", color: "text-on-secondary-fixed" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TeacherDashboardPage() {
  const { isLoading, isError, error, classCards, submissionRate, avgGrade, totalSubmissions, alerts } = useDashboardData()

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-margin-desktop">
        <div className="text-center w-full">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Something went wrong</h2>
          <p className="font-body-md text-on-surface-variant mb-lg">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-lg py-base rounded-full font-label-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pendingAlertCount = alerts.filter((a) => a.status === "ACTIVE" || !a.status).length
  const avgGradeDisplay =
    avgGrade > 0
      ? avgGrade >= 90 ? "A" : avgGrade >= 80 ? "B+" : avgGrade >= 70 ? "B-" : avgGrade >= 60 ? "C" : "D"
      : "—"

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <h1 className="font-headline-lg text-headline-lg text-primary">Dashboard</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-margin-desktop">
        <div className="flex flex-col lg:flex-row gap-gutter">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface">Active Classes</h3>
              {classCards.length > 0 && (
                <Link to="/classes" className="text-primary font-label-md hover:underline">View All</Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-md">
              {classCards.length === 0 && !isLoading && (
                <div className="col-span-full bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-outline mb-sm">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md text-on-surface-variant mb-xs">No classes yet</h4>
                  <p className="text-on-surface-variant font-label-sm max-w-[200px]">Create your first class to get started with grading</p>
                </div>
              )}
              {classCards.map((c, i) => {
                const style = iconOptions[i % iconOptions.length]
                return (
                  <div key={c.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <span className={`${c.pending > 0 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"} text-label-sm px-3 py-1 rounded-full font-bold`}>
                        {c.pending} Pending
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${style.bg} ${style.color} flex items-center justify-center mb-md`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                    </div>
                    <h4 className="font-headline-md text-headline-md mb-xs">{c.name}</h4>
                    <p className="text-on-surface-variant font-body-md mb-lg">{c.section} &bull; {c.students} Students</p>
                    <div className="flex items-center justify-between pt-md border-t border-outline-variant/10">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(c.students, 3) }).map((_, j) => (
                          <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                            {getInitials(`${c.name.split(" ").pop() ?? "S"}${j + 1}`)}
                          </div>
                        ))}
                        {c.students > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                            +{c.students - 3}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/classes/${c.id}`}
                        className="bg-primary text-white px-md py-base rounded-full font-label-md hover:opacity-90 active:scale-95 transition-all"
                      >
                        Open Class
                      </Link>
                    </div>
                  </div>
                )
              })}
              <Link
                to="/classes"
                className="bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-high transition-all group"
              >
                <div className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-outline group-hover:border-primary group-hover:text-primary transition-all mb-sm">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <h4 className="font-headline-md text-headline-md text-on-surface-variant group-hover:text-primary transition-all">Add Class</h4>
                <p className="text-on-surface-variant font-label-sm max-w-[120px]">Create a new section or import from SIS</p>
              </Link>
            </div>

            {totalSubmissions > 0 && (
              <div className="mt-lg">
                <div className="bg-primary/5 rounded-2xl p-lg border border-outline-variant/20 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-headline-md text-headline-md text-primary mb-sm">Weekly Recap</h3>
                    <p className="font-body-md text-on-surface-variant mb-md">
                      {totalSubmissions === 0
                        ? "No submissions yet this week. Grades will appear here once students submit assignments."
                        : `Your students have completed ${submissionRate}% of their assignments this week.`}
                    </p>
                    <div className="flex gap-md">
                      <div className="bg-white p-sm rounded-xl border border-outline-variant/20 flex flex-col">
                        <span className="text-label-sm text-outline">Submission Rate</span>
                        <span className="font-headline-md text-headline-md text-primary">{totalSubmissions > 0 ? `${submissionRate}%` : "—"}</span>
                      </div>
                      <div className="bg-white p-sm rounded-xl border border-outline-variant/20 flex flex-col">
                        <span className="text-label-sm text-outline">Avg. Grade</span>
                        <span className="font-headline-md text-headline-md text-secondary">{avgGradeDisplay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-[160px] text-primary">insights</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Needs Attention</h3>
              {alerts.length > 0 && (
                <span className="bg-error-container text-on-error-container text-label-sm px-2 py-0.5 rounded-full font-bold">{pendingAlertCount}</span>
              )}
            </div>
            <div className="flex flex-col gap-sm">
              {alerts.length === 0 && (
                <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/20 text-center">
                  <span className="material-symbols-outlined text-[32px] text-primary mb-xs block">check_circle</span>
                  <p className="font-body-md text-on-surface-variant text-sm">No alerts to review. Everything looks good!</p>
                </div>
              )}
              {alerts.map((alert) => {
                const isAi = alert.type === "FAILING" || alert.type === "DOWNWARD_TREND" || alert.type === "CONSISTENT_STRUGGLE"
                if (isAi) {
                  return (
                    <div key={alert.id} className="border border-dashed border-primary bg-primary/5 p-md rounded-xl relative group">
                      <div className="flex justify-between items-start mb-base">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
                          <span className="text-primary font-label-sm uppercase tracking-wider">AI Insight</span>
                        </div>
                        <button type="button" className="text-outline hover:text-on-surface">
                          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </button>
                      </div>
                      <h5 className="font-label-md text-on-surface mb-xs">{alert.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</h5>
                      <p className="font-body-md text-on-surface-variant text-sm mb-md">{alert.reason}</p>
                      <button
                        type="button"
                        className="w-full bg-primary text-white py-1.5 rounded-full text-label-sm font-bold hover:opacity-90"
                      >
                        View Details
                      </button>
                    </div>
                  )
                }
                return (
                  <div key={alert.id} className="border border-outline-variant/20 bg-white p-md rounded-xl">
                    <div className="flex items-center gap-sm mb-base">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[12px] font-bold">
                        {alert.type === "MISSED" ? "M" : "F"}
                      </div>
                      <div>
                        <h5 className="font-label-md text-on-surface">{alert.type}</h5>
                        <p className="text-[11px] text-outline">{alert.status}</p>
                      </div>
                    </div>
                    <p className="font-body-md text-on-surface-variant text-sm mb-md">{alert.reason}</p>
                    <button
                      type="button"
                      className="w-full bg-surface-container-low text-on-surface-variant py-1.5 rounded-full text-label-sm font-bold hover:bg-surface-container-high transition-colors"
                    >
                      Review
                    </button>
                  </div>
                )
              })}
            </div>
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
    </>
  )
}

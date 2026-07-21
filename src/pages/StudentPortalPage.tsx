import { Link } from "react-router-dom"
import { MobileNav } from "@/components/layout/MobileNav"

const assignments = [
  { id: "1", icon: "functions", title: "Calculus: Integral Applications", course: "Mathematics • Prof. Henderson", due: "11:59 PM", resources: 2, status: "due-today" },
  { id: "2", icon: "menu_book", title: "Modern History: The Cold War Essay", course: "Social Studies • Ms. Thorne", due: "Due Thursday", resources: 0, status: "draft" },
]

const grades = [
  { id: "1", subject: "Physics: Orbital Mechanics Lab", date: "Submitted 3 days ago", grade: "A-", score: "92/100", feedback: '"Excellent data visualization in your results section, Alex. Your analysis of the gravitational constants was spot on. Watch your significant figures in the final calculation next time!"', teacher: "Mr. Gable" },
  { id: "2", subject: "Literature: Macbeth Analysis", date: "Submitted 1 week ago", grade: "A", score: "96/100", feedback: '"Thoughtful thesis statement and well-supported arguments throughout. Your interpretation of the three witches was particularly creative."', teacher: "Mrs. Bennett" },
]

const submitted = [
  { id: "3", title: "Creative Writing: Short Story", date: "Submitted yesterday at 4:30 PM", grade: "Pending Grade" },
  { id: "4", title: "Chemistry: Periodic Trends Quiz", date: "Submitted 4 days ago", grade: "Pending Grade" },
]

export function StudentPortalPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-margin-mobile py-4 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">EduAI</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low pb-md px-sm gap-base sticky top-0 shrink-0 border-r border-surface-container-high/50 fixed left-0 top-0">
        <div className="flex flex-col gap-xs px-3 pt-md pb-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI</h1>
              <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow space-y-0.5 px-2">
          {[
            { icon: "assignment", label: "Assignments", id: "assignments", href: "/student-portal" },
            { icon: "grade", label: "My Grades", id: "grades", href: "/student-portal/grades" },
            { icon: "calendar_today", label: "Schedule", id: "schedule", href: "/student-portal/schedule" },
            { icon: "forum", label: "Messages", id: "messages", href: "/student-portal/messages" },
          ].map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 bg-primary-container text-on-primary-container font-bold"
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-0.5 px-2 pt-base border-t border-outline-variant/20">
          {[
            { icon: "settings", label: "Settings", id: "settings", href: "/student-portal/settings" },
          ].map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 flex-1">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Assignments</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Alex Rivera • Grade 11 • Section A</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="material-symbols-outlined text-outline-variant text-[20px]">search</span>
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant w-40" />
            </div>
            <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-margin-mobile md:p-md space-y-4 md:space-y-6 pb-24 md:pb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: "pending_actions", label: "Due Today", value: "2 Items", color: "text-secondary" },
              { icon: "check_circle", label: "Submitted", value: "14 Total", color: "text-primary" },
              { icon: "trending_up", label: "GPA Average", value: "3.8", color: "text-primary" },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 md:p-5">
                <span className={`material-symbols-outlined text-[22px] md:text-[24px] ${stat.color}`}>{stat.icon}</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">{stat.label}</p>
                <p className="font-headline-md text-headline-md text-on-surface mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tab Bar */}
          <div className="flex gap-4 border-b border-outline-variant/20 pb-3">
            {["Upcoming", "Completed", "Drafts"].map((tab) => (
              <button key={tab} type="button" className={`font-label-md text-label-md pb-1 border-b-2 transition-colors ${
                tab === "Upcoming" ? "text-primary border-primary" : "text-on-surface-variant border-transparent"
              }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Assignment Cards */}
          {assignments.map((a) => (
            <div key={a.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">{a.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-label-md text-label-md text-on-surface">{a.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{a.course}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {a.due}
                  </span>
                  {a.resources > 0 && (
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">attach_file</span>
                      {a.resources} Resources
                    </span>
                  )}
                  {a.status === "draft" && (
                    <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">history_edu</span>
                      Draft saved 2h ago
                    </span>
                  )}
                </div>
              </div>
              <Link to={`/student-portal/assignments/${a.id}`} className="font-label-md text-label-md text-primary font-bold hover:underline whitespace-nowrap">
                {a.status === "due-today" ? "Open Assignment" : "Resume Draft"}
              </Link>
            </div>
          ))}

          {/* Recent Grades */}
          <h2 className="font-headline-md text-headline-md text-on-surface pt-2">Recent Grades & Feedback</h2>
          {grades.map((g) => (
            <div key={g.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface">{g.subject}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{g.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-headline-md text-headline-md text-primary">{g.grade}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{g.score}</p>
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">comment</span>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Feedback from {g.teacher}</p>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{g.feedback}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Already Submitted */}
          <h2 className="font-headline-md text-headline-md text-on-surface pt-2">Already Submitted</h2>
          {submitted.map((s) => (
            <div key={s.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>
              <div className="flex-1">
                <h3 className="font-label-md text-label-md text-on-surface">{s.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{s.date}</p>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{s.grade}</span>
            </div>
          ))}

          {/* Footer */}
          <footer className="text-center pt-4 pb-2">
            <p className="font-label-sm text-label-sm text-outline-variant">© 2024 EduAI Educational Systems • Student Life Portal • version 2.4.1</p>
          </footer>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

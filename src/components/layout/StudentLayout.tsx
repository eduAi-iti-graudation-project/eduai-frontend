import { Outlet, Link, useLocation } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { TopNavBar } from "./TopNavBar"

const navItems = [
  { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/student" },
  { icon: "school", label: "Classes", id: "classes", href: "/student/classes" },
  { icon: "assignment", label: "Assignments", id: "assignments", href: "/student/assignments" },
  { icon: "auto_awesome", label: "Homework Help", id: "homework-help", href: "/student/homework-help" },
  { icon: "quiz", label: "Quizzes", id: "quizzes", href: "/student/quizzes" },
  { icon: "grade", label: "My Grades", id: "grades", href: "/student/grades" },
  { icon: "monitoring", label: "Insights", id: "insights", href: "/student/insights" },
  { icon: "chat_bubble", label: "Messages", id: "chat", href: "/student/chat" },
  { icon: "calendar_today", label: "Attendance", id: "attendance", href: "/student/attendance" },
  { icon: "notifications", label: "Notifications", id: "notifications", href: "/student/notifications" },
]

const bottomItems = [
  { icon: "settings", label: "Settings", id: "settings", href: "/student/settings" },
]

export function StudentLayout() {
  const location = useLocation()
  const path = location.pathname

  const activeItem = path === "/student" ? "dashboard"
    : path.startsWith("/student/classes") ? "classes"
    : path.startsWith("/student/assignments") ? "assignments"
    : path.startsWith("/student/submissions") ? "assignments"
    : path.startsWith("/student/grades") ? "grades"
    : path.startsWith("/student/attendance") ? "attendance"
    : path.startsWith("/student/insights") ? "insights"
    : path.startsWith("/student/chat") ? "chat"
    : path.startsWith("/student/homework-help") ? "homework-help"
    : path.startsWith("/student/quizzes") ? "quizzes"
    : path.startsWith("/student/notifications") ? "notifications"
    : path.startsWith("/student/settings") ? "settings"
    : "dashboard"

  return (
    <div className="flex min-h-screen bg-surface">
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
          <Link to="/notifications" className="material-symbols-outlined text-on-surface-variant">notifications</Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low pb-md px-sm gap-base sticky top-0 shrink-0 border-r border-surface-container-high/50">
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
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 ${
                activeItem === item.id
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="space-y-0.5 px-2 pt-base border-t border-outline-variant/20">
          {bottomItems.map((item) => (
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
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

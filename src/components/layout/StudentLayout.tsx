import { Outlet, Link, useLocation } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { TopNavBar } from "./TopNavBar"
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner"

const navItems = [
  { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/student" },
  { icon: "calendar_month", label: "Timetable", id: "timetable", href: "/student/timetable" },
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
    : path.startsWith("/student/timetable") ? "timetable"
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
    <div className="flex min-h-screen bg-surface-container-low">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-margin-mobile py-4 bg-surface-container-lowest border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">EduAI</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <Link to="/notifications" className="material-symbols-outlined text-on-surface-variant">notifications</Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 bg-[#151A2E] pb-md px-sm gap-base sticky top-0 shrink-0 border-r border-[#232f4e]">
        <div className="flex flex-col gap-xs px-3 pt-md pb-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2C5FB3] rounded-lg flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-white leading-none">EduAI</h1>
              <p className="text-label-sm font-label-sm text-[#8a95b3] mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow space-y-0.5 px-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                activeItem === item.id
                  ? "bg-[#1E2A4A] text-white font-semibold"
                  : "text-[#a9b2c8] hover:bg-white/5 hover:text-white"
              }`}
            >
              {activeItem === item.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-[#2C5FB3]" />
              )}
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="space-y-0.5 px-2 pt-base border-t border-[#232f4e]">
          {bottomItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-[#a9b2c8] hover:bg-white/5 hover:text-white rounded-lg transition-colors"
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
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
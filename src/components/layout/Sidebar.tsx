import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const path = location.pathname

  const activeItem = path === "/dashboard" ? "dashboard"
    : path.startsWith("/classes") ? "classes"
    : path.startsWith("/assignments") ? "assignments"
    : path.startsWith("/rubrics") ? "rubrics"
    : path.startsWith("/submissions") ? "submissions"
    : path.startsWith("/quizzes") ? "quizzes"
    : path.startsWith("/alerts") ? "alerts"
    : path.startsWith("/insights") ? "insights"
    : path.startsWith("/chat") ? "chat"
    : path.startsWith("/notifications") ? "notifications"
    : path.startsWith("/assistant") ? "assistant"
    : path.startsWith("/grades") ? "grades"
    : "dashboard"

  const navItems = [
    { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/dashboard" },
    { icon: "school", label: "Classes", id: "classes", href: "/classes" },
    { icon: "assignment", label: "Assignments", id: "assignments", href: "/assignments/new" },
    { icon: "assignment_turned_in", label: "Rubrics", id: "rubrics", href: "/rubrics" },
    { icon: "list_alt", label: "Submissions", id: "submissions", href: "/submissions" },
    { icon: "quiz", label: "Quizzes", id: "quizzes", href: "/quizzes" },
    { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/alerts" },
    { icon: "monitoring", label: "Insights", id: "insights", href: "/insights" },
    { icon: "chat_bubble", label: "Messages", id: "chat", href: "/chat" },
    { icon: "notifications", label: "Notifications", id: "notifications", href: "/notifications" },
    { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant" },
    { icon: "grade", label: "My Grades", id: "grades", href: "/grades" },
  ]

  const bottomItems = [{ icon: "contact_support", label: "Help Center", id: "help", href: "/support" }]

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[280px] flex-col bg-[#151A2E] border-r border-[#232f4e] z-40">
      {/* Brand */}
      <div className="flex items-center gap-sm px-md py-md">
        <div className="w-10 h-10 rounded-lg bg-[#2C5FB3] flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-white leading-none">EduAI</h1>
          <p className="font-label-sm text-label-sm text-[#8a95b3] mt-1">School Management</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-hidden px-3 space-y-0.5 pt-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors",
              activeItem === item.id
                ? "bg-[#1E2A4A] text-white font-semibold"
                : "text-[#a9b2c8] hover:bg-white/5 hover:text-white"
            )}
          >
            {activeItem === item.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-[#2C5FB3]" />
            )}
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-label-md text-label-md font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-md border-t border-[#232f4e] space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-[#a9b2c8] hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-label-md text-label-md font-medium">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-1.5 w-full rounded-lg text-[#a9b2c8] hover:bg-white/5 hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-md text-label-md font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  )
}
import { Link, useLocation } from "react-router-dom"

export function Sidebar() {
  const location = useLocation()
  const path = location.pathname

  const activeItem = path === "/dashboard" ? "dashboard"
    : path.startsWith("/classes") ? "classes"
    : path.startsWith("/rubrics") ? "rubrics"
    : path.startsWith("/submissions") ? "submissions"
    : path.startsWith("/quizzes") ? "quizzes"
    : path.startsWith("/alerts") ? "alerts"
    : path.startsWith("/notifications") ? "notifications"
    : path.startsWith("/assistant") ? "assistant"
    : "dashboard"

  const navItems = [
    { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/dashboard" },
    { icon: "school", label: "Classes", id: "classes", href: "/classes" },
    { icon: "assignment_turned_in", label: "Rubrics", id: "rubrics", href: "/rubrics" },
    { icon: "list_alt", label: "Submissions", id: "submissions", href: "/submissions" },
    { icon: "quiz", label: "Quizzes", id: "quizzes", href: "/quizzes" },
    { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/alerts" },
    { icon: "notifications", label: "Notifications", id: "notifications", href: "/notifications" },
    { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant" },
  ]

  const bottomItems = [
    { icon: "settings", label: "Settings", id: "settings", href: "/settings" },
    { icon: "contact_support", label: "Support", id: "support", href: "/support" },
  ]

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low py-md px-sm gap-base border-r border-outline-variant/20 sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-sm px-sm mb-lg">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI Admin</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Teacher Portal</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={`flex items-center gap-sm px-md py-sm rounded-full font-bold transition-all duration-200 ${
              activeItem === item.id
                ? "bg-primary-container text-on-primary-container active:scale-95"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* New Rubric + Bottom Nav */}
      <div className="mt-auto pt-lg space-y-1">
        <Link
          to="/rubrics/new"
          className="w-full bg-secondary-container text-on-secondary-container py-sm px-md rounded-full font-bold mb-md hover:opacity-90 transition-opacity flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined">add</span>
          New Rubric
        </Link>
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}

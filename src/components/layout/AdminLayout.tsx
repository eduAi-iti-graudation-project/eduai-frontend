import { Outlet, Link, useLocation } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"

const navItems = [
  { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/admin" },
  { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/admin/alerts" },
  { icon: "school", label: "Grades", id: "grades", href: "/admin/grades" },
  { icon: "group", label: "Students", id: "students", href: "/admin/students" },
  { icon: "grade", label: "Student Grades", id: "student-grades", href: "/admin/student-grades" },
  { icon: "event_available", label: "Attendance", id: "attendance", href: "/admin/attendance" },
  { icon: "monitoring", label: "Insights", id: "insights", href: "/admin/insights" },
]

export function AdminLayout() {
  const location = useLocation()
  const path = location.pathname

  const activeItem = path === "/admin" ? "dashboard"
    : path.startsWith("/admin/alerts") ? "alerts"
    : path.startsWith("/admin/grades") ? "grades"
    : path.startsWith("/admin/students") ? "students"
    : path.startsWith("/admin/student-grades") ? "student-grades"
    : path.startsWith("/admin/attendance") ? "attendance"
    : path.startsWith("/admin/insights") ? "insights"
    : "dashboard"

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low py-md px-sm gap-base border-r border-outline-variant/20 sticky top-0 shrink-0">
        <div className="flex items-center gap-sm px-sm mb-lg">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI Admin</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Admin Portal</p>
          </div>
        </div>

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

      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20">
          <h1 className="font-headline-md text-headline-md text-primary">
            {navItems.find((n) => n.id === activeItem)?.label ?? "Admin"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

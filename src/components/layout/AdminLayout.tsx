import { Outlet, Link, useLocation } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner"

const navItems = [
  { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/admin" },
  { icon: "calendar_month", label: "Timetable", id: "timetable", href: "/admin/timetable" },
  { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/admin/alerts" },
  { icon: "school", label: "Grades", id: "grades", href: "/admin/grades" },
  { icon: "group", label: "Students", id: "students", href: "/admin/students" },
  { icon: "co_present", label: "Teachers", id: "teachers", href: "/admin/teachers" },
  { icon: "import_export", label: "Import Students", id: "migration", href: "/admin/migration" },
  { icon: "monitoring", label: "Insights", id: "insights", href: "/admin/insights" },
  { icon: "smart_toy", label: "AI Assistant", id: "assistant", href: "/admin/assistant" },
  { icon: "payments", label: "Billing", id: "billing", href: "/admin/billing" },
  { icon: "person_add", label: "Requests", id: "requests", href: "/admin/requests" },
  { icon: "how_to_reg", label: "Join Approvals", id: "join-approvals", href: "/admin/join-approvals" },
]

export function AdminLayout() {
  const location = useLocation()
  const path = location.pathname

  const activeItem = path === "/admin" ? "dashboard"
    : path.startsWith("/admin/timetable") ? "timetable"
    : path.startsWith("/admin/alerts") ? "alerts"
    : path.startsWith("/admin/grades") ? "grades"
    : path.startsWith("/admin/students") ? "students"
    : path.startsWith("/admin/teachers") ? "teachers"
    : path.startsWith("/admin/insights") ? "insights"
    : path.startsWith("/admin/migration") ? "migration"
    : path.startsWith("/admin/assistant") ? "assistant"
    : path.startsWith("/admin/billing") ? "billing"
    : path.startsWith("/admin/requests") ? "requests"
    : path.startsWith("/admin/join-approvals") ? "join-approvals"
    : "dashboard"

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-container-low">
      <aside className="hidden md:flex flex-col h-screen w-64 bg-[#151A2E] py-4 px-3 border-r border-[#232f4e] sticky top-0 shrink-0">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#2C5FB3] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-white leading-none">EduAI Admin</h1>
            <p className="font-label-sm text-label-sm text-[#8a95b3] mt-0.5">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeItem === item.id
                  ? "bg-[#1E2A4A] text-white font-semibold"
                  : "text-[#a9b2c8] hover:bg-white/5 hover:text-white"
              }`}
            >
              {activeItem === item.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-[#2C5FB3]" />
              )}
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-6 py-4 bg-surface-container-lowest border-b border-border">
          <h1 className="font-headline-md text-headline-md text-on-surface">
            {navItems.find((n) => n.id === activeItem)?.label ?? "Admin"}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <SubscriptionBanner />
        <main className="flex-1 min-h-0 overflow-y-auto min-w-0 w-full">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
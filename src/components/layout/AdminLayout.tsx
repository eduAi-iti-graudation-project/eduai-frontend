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
 { icon: "folder_open", label: "Documents", id: "documents", href: "/admin/documents" },
 { icon: "co_present", label: "Teachers", id: "teachers", href: "/admin/teachers" },
{ icon: "import_export", label: "Import Students", id: "migration", href: "/admin/migration" },
 { icon: "monitoring", label: "Insights", id: "insights", href: "/admin/insights" },
 { icon: "chat_bubble", label: "Messages", id: "chat", href: "/admin/chat" },
 { icon: "campaign", label: "Broadcast", id: "broadcasts", href: "/admin/broadcasts" },
 { icon: "smart_toy", label: "AI Assistant", id: "assistant", href: "/admin/assistant" },
 { icon: "payments", label: "Billing", id: "billing", href: "/admin/billing" },
 { icon: "domain", label: "School Groups", id: "groups", href: "/admin/groups" },
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
  : path.startsWith("/admin/documents") ? "documents"
  : path.startsWith("/admin/teachers") ? "teachers"
  : path.startsWith("/admin/import") ? "import"
  : path.startsWith("/admin/insights") ? "insights"
  : path.startsWith("/admin/migration") ? "migration"
  : path.startsWith("/admin/chat") ? "chat"
  : path.startsWith("/admin/broadcasts") ? "broadcasts"
  : path.startsWith("/admin/assistant") ? "assistant"
  : path.startsWith("/admin/billing") ? "billing"
  : path.startsWith("/admin/groups") ? "groups"
  : path.startsWith("/admin/requests") ? "requests"
  : path.startsWith("/admin/join-approvals") ? "join-approvals"
  : "dashboard"

 return (
  <div className="flex h-dvh overflow-hidden bg-surface">
   <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-lowest py-4 px-3 border-r border-surface-container shadow-[4px_0_24px_rgba(164,48,115,0.08)] sticky top-0 shrink-0">
    <div className="flex items-center gap-2.5 px-2 mb-6">
     <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
     </div>
     <div>
      <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI Admin</h1>
      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Admin Portal</p>
     </div>
    </div>

    <nav className="flex-1 space-y-0.5">
     {navItems.map((item) => (
      <Link
       key={item.id}
       to={item.href}
       className={`relative flex items-center gap-2.5 px-3 py-2 rounded-full press-scale transition-colors duration-150 ease-premium ${
        activeItem === item.id
         ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
         : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
       }`}
      >
       <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
       <span className="font-label-md text-label-md">{item.label}</span>
      </Link>
     ))}
    </nav>
   </aside>

   <div className="flex-1 flex flex-col min-w-0">
    <header className="hidden md:flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-container">
     <h1 className="font-headline-md text-headline-md text-primary">
      {navItems.find((n) => n.id === activeItem)?.label ?? "Admin"}
     </h1>
     <div className="flex items-center gap-3">
      <NotificationBell />
      <UserMenu />
     </div>
    </header>
    <SubscriptionBanner />
    <main className="flex-1 min-h-0 overflow-y-auto min-w-0 w-full">
     <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary-fixed/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary-fixed/15 rounded-full blur-[100px]" />
     </div>
     <div className="relative">
      <Outlet />
     </div>
    </main>
   </div>

   <MobileNav />
  </div>
 )
}
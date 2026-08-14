import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"

interface NavItem {
  icon: string
  label: string
  id: string
  href: string
  prefixes: string[]
}

export function MobileNav() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname
  const role = user?.role ?? "STUDENT"

  const items: NavItem[] = [
    { icon: "home", label: "Home", id: "home", href: "/dashboard", prefixes: ["/dashboard"] },
    { icon: "school", label: "Sections", id: "classes", href: "/classes", prefixes: ["/classes"] },
    { icon: "chat_bubble", label: "Messages", id: "chat", href: "/chat", prefixes: ["/chat"] },
    { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/alerts", prefixes: ["/alerts"] },
    { icon: "monitoring", label: "Insights", id: "insights", href: "/insights", prefixes: ["/insights"] },
    { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant", prefixes: ["/assistant"] },
  ]

  const studentItems: NavItem[] = [
    { icon: "home", label: "Home", id: "home", href: "/student", prefixes: ["/student"] },
    { icon: "school", label: "Courses", id: "classes", href: "/student/classes", prefixes: ["/student/classes"] },
    { icon: "chat_bubble", label: "Messages", id: "chat", href: "/student/chat", prefixes: ["/student/chat"] },
    { icon: "calendar_today", label: "Attendance", id: "attendance", href: "/student/attendance", prefixes: ["/student/attendance"] },
    { icon: "auto_awesome", label: "Help", id: "homework-help", href: "/student/homework-help", prefixes: ["/student/homework-help"] },
  ]

  const adminItems: NavItem[] = [
    { icon: "home", label: "Home", id: "home", href: "/admin", prefixes: ["/admin"] },
    { icon: "person", label: "Students", id: "students", href: "/admin/students", prefixes: ["/admin/students"] },
    { icon: "school", label: "Teachers", id: "teachers", href: "/admin/teachers", prefixes: ["/admin/teachers"] },
    { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/admin/alerts", prefixes: ["/admin/alerts"] },
    { icon: "monitoring", label: "Insights", id: "insights", href: "/admin/insights", prefixes: ["/admin/insights"] },
    { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/admin/assistant", prefixes: ["/admin/assistant"] },
  ]

  const navItems = role === "ADMIN" ? adminItems : role === "STUDENT" ? studentItems : items

  const homePath = role === "STUDENT" ? "/student" : role === "ADMIN" ? "/admin" : "/dashboard"
  const activeItem =
    path === homePath
      ? "home"
      : navItems.find((item) => item.prefixes.some((prefix) => path !== prefix && path.startsWith(prefix)))?.id ?? "home"

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-margin-mobile py-base pb-safe bg-surface-container-lowest shadow-lg border-t border-border">
      {navItems.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className={`flex flex-col items-center justify-center transition-colors px-3 py-1 ${
            activeItem === item.id
              ? "text-primary"
              : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeItem === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
          <span className="font-label-sm text-label-sm mt-0.5">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
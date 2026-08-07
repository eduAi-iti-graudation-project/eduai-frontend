import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"

export function MobileNav() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname
  const chatHref = user?.role === "TEACHER" ? "/chat" : "/student/chat"

  const items = [
    { icon: "home", label: "Home", id: "home", href: "/dashboard" },
    { icon: "school", label: "Classes", id: "classes", href: "/classes" },
    { icon: "chat_bubble", label: "Messages", id: "chat", href: chatHref },
    { icon: "notifications", label: "Alerts", id: "alerts", href: "/alerts" },
    { icon: "monitoring", label: "Insights", id: "insights", href: "/insights" },
    { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant" },
  ]

  const activeItem = path === "/dashboard" ? "home"
    : path.startsWith("/classes") ? "classes"
    : path.startsWith("/chat") || path.startsWith("/student/chat") ? "chat"
    : path.startsWith("/alerts") ? "alerts"
    : path.startsWith("/insights") ? "insights"
    : path.startsWith("/assistant") ? "assistant"
    : "home"

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-margin-mobile py-base pb-safe bg-surface-container-lowest shadow-lg border-t border-border">
      {items.map((item) => (
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

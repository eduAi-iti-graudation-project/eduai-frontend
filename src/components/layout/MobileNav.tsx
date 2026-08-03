import { useLocation, Link } from "react-router-dom"

const items = [
  { icon: "home", label: "Home", id: "home", href: "/dashboard" },
  { icon: "school", label: "Classes", id: "classes", href: "/classes" },
  { icon: "notifications", label: "Alerts", id: "alerts", href: "/alerts" },
  { icon: "monitoring", label: "Insights", id: "insights", href: "/insights" },
  { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant" },
]

export function MobileNav() {
  const location = useLocation()
  const path = location.pathname

  const activeItem = path === "/dashboard" ? "home"
    : path.startsWith("/classes") ? "classes"
    : path.startsWith("/alerts") ? "alerts"
    : path.startsWith("/insights") ? "insights"
    : path.startsWith("/assistant") ? "assistant"
    : "home"

  return (
    <>
      {/* Floating Add Button */}
      <Link
        to="/rubrics/new"
        className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-secondary-container text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>

      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-margin-mobile py-base pb-safe bg-surface shadow-lg rounded-t-xl border-t border-outline-variant/20">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              activeItem === item.id
                ? "bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-90"
                : "text-on-surface-variant px-4 py-1 active:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={activeItem === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
            <span className="font-label-sm text-label-sm mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

interface SidebarProps {
  activeItem?: string
}

export function Sidebar({ activeItem = "submissions" }: SidebarProps) {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", id: "dashboard" },
    { icon: "school", label: "Classes", id: "classes" },
    { icon: "assignment_turned_in", label: "Rubrics", id: "rubrics" },
    { icon: "list_alt", label: "Submissions", id: "submissions" },
    { icon: "notifications_active", label: "Alerts", id: "alerts" },
    { icon: "smart_toy", label: "Assistant", id: "assistant" },
  ]

  const bottomItems = [
    { icon: "settings", label: "Settings", id: "settings" },
    { icon: "contact_support", label: "Support", id: "support" },
  ]

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low py-md px-sm gap-base sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex flex-col gap-xs px-2 mb-lg">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI Admin</h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <a
            key={item.id}
            className={`flex items-center gap-sm px-4 py-3 rounded-full transition-all duration-200 ${
              activeItem === item.id
                ? "bg-primary-container text-on-primary-container font-bold scale-98"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
            href="#"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="mt-auto space-y-1 pt-base border-t border-outline-variant/30">
        {bottomItems.map((item) => (
          <a
            key={item.id}
            className="flex items-center gap-sm px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all duration-200"
            href="#"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}
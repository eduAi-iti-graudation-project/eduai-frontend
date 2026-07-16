interface MobileNavProps {
  activeItem?: string
}

export function MobileNav({ activeItem = "submissions" }: MobileNavProps) {
  const items = [
    { icon: "home", label: "Home", id: "home" },
    { icon: "school", label: "Classes", id: "classes" },
    { icon: "list_alt", label: "Submits", id: "submissions" },
    { icon: "smart_toy", label: "AI Bot", id: "assistant" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface border-t border-outline-variant/30 py-base px-margin-mobile pb-safe shadow-lg">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex flex-col items-center justify-center px-4 py-1 ${
            activeItem === item.id
              ? "bg-secondary-container text-on-secondary-container rounded-full scale-90 active:scale-90 transition-transform duration-200"
              : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-label-sm text-[10px]">{item.label}</span>
        </div>
      ))}
    </nav>
  )
}
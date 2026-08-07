import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"

export function TopNavBar() {
  return (
    <header className="hidden md:flex items-center justify-between h-16 px-gutter bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-40 shrink-0">
      {/* Search (left) */}
      <div className="flex items-center flex-1 max-w-2xl relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: 20 }}>search</span>
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-md border border-outline-variant text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder="Search students, classes, or assignments..."
          type="text"
        />
      </div>

      {/* Trailing actions */}
      <div className="flex items-center gap-sm shrink-0">
        <NotificationBell />
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer" aria-label="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="h-8 w-px bg-outline-variant mx-2" />
        <UserMenu />
      </div>
    </header>
  )
}
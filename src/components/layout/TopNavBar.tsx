import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"

export function TopNavBar() {
  return (
    <header className="hidden md:flex items-center justify-between h-16 px-md bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0 z-40">
      <div className="flex items-center gap-md">
 
      </div>
      <div className="flex items-center gap-md">
        <NotificationBell />
        <button className="text-on-surface-variant hover:text-primary-container transition-colors rounded-full p-1">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <UserMenu />
      </div>
    </header>
  )
}

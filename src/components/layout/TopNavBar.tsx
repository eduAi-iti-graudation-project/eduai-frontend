import { useNavigate } from "react-router-dom"
import { UserMenu } from "@/components/ui/UserMenu"
import { NotificationBell } from "@/components/communication/NotificationBell"
import { useAuth } from "@/providers/use-auth"
import { GlobalSearchBox } from "./GlobalSearchBox"

export function TopNavBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-gutter bg-surface border-b border-outline-variant shadow-sm sticky top-0 z-40 shrink-0">
      <GlobalSearchBox className="flex-1 max-w-2xl" />

      {/* Trailing actions */}
      <div className="flex items-center gap-sm shrink-0">
        <NotificationBell />
        <button
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer"
          aria-label="Help"
          onClick={() => navigate(isTeacher ? "/support" : "/student/support")}
        >
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="h-8 w-px bg-outline-variant mx-2" />
        <UserMenu />
      </div>
    </header>
  )
}
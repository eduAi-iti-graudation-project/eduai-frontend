import { useAuth } from "@/providers/use-auth"
import { Link } from "react-router-dom"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TopNavBar() {
  const { user } = useAuth()

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-md bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0 z-40">
      <div className="flex items-center gap-md">
 
      </div>
      <div className="flex items-center gap-md">
        <Link
          to="/alerts"
          className="text-on-surface-variant hover:text-primary-container transition-colors rounded-full p-1"
        >
          <span className="material-symbols-outlined">notifications</span>
        </Link>
        <button className="text-on-surface-variant hover:text-primary-container transition-colors rounded-full p-1">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="h-10 w-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-label-md text-label-md shadow-sm">
          {user?.name ? getInitials(user.name) : <span className="material-symbols-outlined text-[20px]">person</span>}
        </div>
      </div>
    </header>
  )
}

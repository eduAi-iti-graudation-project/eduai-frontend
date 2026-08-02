import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"

interface UserMenuProps {
  placement?: "top" | "bottom"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu({ placement = "top" }: UserMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-label-md text-label-md shadow-sm hover:opacity-90 transition-opacity"
      >
        {user?.name ? getInitials(user.name) : <span className="material-symbols-outlined text-[20px]">person</span>}
      </button>

      {open && (
        <>
          <div className={`absolute right-0 w-64 bg-white rounded-2xl shadow-xl border border-outline-variant/10 py-2 z-50 ${placement === "bottom" ? "bottom-full mb-2" : "top-12"}`}>
            <div className="px-4 py-3 border-b border-outline-variant/10">
              <p className="font-label-md text-label-md text-on-surface font-bold truncate">{user?.name ?? "User"}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email ?? ""}</p>
            </div>
            <div className="px-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-error hover:bg-error-container/20 transition-colors font-label-md text-label-md"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

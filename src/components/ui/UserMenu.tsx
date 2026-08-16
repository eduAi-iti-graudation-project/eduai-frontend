import { useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { getGradeLabel } from "@/lib/grade-label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

 function handleLogout() {
  logout()
  navigate("/login")
 }

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     variant="ghost"
     className="h-10 w-10 rounded-full p-0 bg-primary text-primary-foreground shadow-card hover:bg-primary/90 hover:opacity-90 transition-opacity"
     aria-label="User menu"
    >
     {user?.name ? (
      <Avatar className="h-10 w-10">
       <AvatarFallback className="bg-primary text-primary-foreground font-label-md text-label-md">
        {getInitials(user.name)}
       </AvatarFallback>
      </Avatar>
     ) : (
      <span className="material-symbols-outlined text-[20px]">person</span>
     )}
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent
    align="end"
    side={placement === "bottom" ? "top" : "bottom"}
    className="w-64 rounded-lg border-border p-1 bg-popover"
   >
    <DropdownMenuLabel className="px-4 py-3 border-b border-border font-normal">
     <p className="font-label-md text-label-md text-on-surface font-bold truncate">{user?.name ?? "User"}</p>
     <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email ?? ""}</p>
     {user?.role === "STUDENT" && getGradeLabel(user.grade) && (
      <p className="font-label-sm text-label-sm text-primary truncate mt-0.5">{getGradeLabel(user.grade)}</p>
     )}
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem
     onClick={handleLogout}
     className="flex items-center gap-3 rounded-lg text-error focus:bg-error-container/20 focus:text-error cursor-pointer font-label-md text-label-md"
    >
     <span className="material-symbols-outlined text-[20px]">logout</span>
     Logout
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 )
}

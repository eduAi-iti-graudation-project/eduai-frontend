import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNavBar } from "./TopNavBar"
import { MobileNav } from "./MobileNav"

export function TeacherLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

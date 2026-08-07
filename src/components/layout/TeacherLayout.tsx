import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNavBar } from "./TopNavBar"
import { MobileNav } from "./MobileNav"
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner"

export function TeacherLayout() {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:pl-[280px]">
        <TopNavBar />
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

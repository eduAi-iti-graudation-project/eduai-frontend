import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNavBar } from "./TopNavBar"
import { MobileNav } from "./MobileNav"
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner"

export function TeacherLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-surface-container-low">
      <Sidebar />
      <div className="flex h-full flex-col md:pl-[280px]">
        <TopNavBar />
        <SubscriptionBanner />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

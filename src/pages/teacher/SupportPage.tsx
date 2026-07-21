import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { TopNavBar } from "@/components/layout/TopNavBar"

export function SupportPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNavBar />
        <div className="flex-1 flex items-center justify-center p-md">
          <p className="font-body-md text-body-md text-on-surface-variant">Support page coming soon.</p>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

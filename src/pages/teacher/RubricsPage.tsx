import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"

export function RubricsPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20 sticky top-0 z-30">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Rubrics</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-md">
          <p className="font-body-md text-body-md text-on-surface-variant">Rubrics page coming soon.</p>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

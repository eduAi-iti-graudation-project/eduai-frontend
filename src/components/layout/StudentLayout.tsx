import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { TopNavBar } from "./TopNavBar"
import { GlobalSearchBox } from "./GlobalSearchBox"
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner"

const navItems = [
 { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/student" },
 { icon: "calendar_month", label: "Timetable", id: "timetable", href: "/student/timetable" },
 { icon: "school", label: "Courses", id: "classes", href: "/student/classes" },
 { icon: "auto_awesome", label: "Homework Help", id: "homework-help", href: "/student/homework-help" },
 { icon: "auto_stories", label: "Study Lab", id: "study-lab", href: "/student/study-lab" },
 { icon: "science", label: "Lab Simulations", id: "labs", href: "/student/labs" },
 { icon: "quiz", label: "Quizzes", id: "quizzes", href: "/student/quizzes" },
 { icon: "monitoring", label: "Insights", id: "insights", href: "/student/insights" },
 { icon: "chat_bubble", label: "Messages", id: "chat", href: "/student/chat" },
 { icon: "calendar_today", label: "Attendance", id: "attendance", href: "/student/attendance" },
 { icon: "video_camera_front", label: "Meetings", id: "meetings", href: "/student/meetings" },
 { icon: "notifications", label: "Notifications", id: "notifications", href: "/student/notifications" },
 { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/student/alerts" },
]

const bottomItems = [
 { icon: "settings", label: "Settings", id: "settings", href: "/student/settings" },
]

export function StudentLayout() {
 const location = useLocation()
 const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
 const path = location.pathname

 const activeItem = path === "/student" ? "dashboard"
  : path.startsWith("/student/timetable") ? "timetable"
  : path.startsWith("/student/classes") ? "classes"
  : path.startsWith("/student/submissions") ? "classes"
  : path.startsWith("/student/grades") ? "grades"
  : path.startsWith("/student/attendance") ? "attendance"
  : path.startsWith("/student/meetings") ? "meetings"
  : path.startsWith("/student/insights") ? "insights"
  : path.startsWith("/student/chat") ? "chat"
  : path.startsWith("/student/homework-help") ? "homework-help"
  : path.startsWith("/student/study-lab") ? "study-lab"
  : path.startsWith("/student/labs") ? "labs"
  : path.startsWith("/student/quizzes") ? "quizzes"
  : path.startsWith("/student/notifications") ? "notifications"
  : path.startsWith("/student/alerts") ? "alerts"
  : path.startsWith("/student/settings") ? "settings"
  : "dashboard"

 return (
  <div className="flex h-dvh overflow-hidden bg-surface">
   {/* Mobile Header */}
   <header className="md:hidden flex items-center justify-between px-margin-mobile py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-container">
    <div className="flex items-center gap-2">
     <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-on-primary">
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
     </div>
     <h1 className="font-headline-md text-headline-md text-primary font-bold">EduAI</h1>
    </div>
    <div className="flex items-center gap-3">
     {mobileSearchOpen ? (
      <GlobalSearchBox className="w-48 sm:w-64" />
     ) : (
      <button
       type="button"
       className="material-symbols-outlined text-on-surface-variant p-1 cursor-pointer"
       aria-label="Search"
       onClick={() => setMobileSearchOpen(true)}
      >
       search
      </button>
     )}
     <Link to="/student/notifications" className="material-symbols-outlined text-on-surface-variant">notifications</Link>
    </div>
   </header>

   {/* Desktop Sidebar */}
   <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-lowest pb-md px-sm gap-base sticky top-0 shrink-0 border-r border-surface-container shadow-[4px_0_24px_rgba(164,48,115,0.08)]">
    <div className="flex flex-col gap-xs px-3 pt-md pb-lg">
     <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
       <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
      </div>
      <div>
       <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI</h1>
       <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Student Portal</p>
      </div>
     </div>
    </div>

    <nav className="flex-grow space-y-0.5 px-2">
     {navItems.map((item) => (
      <Link
       key={item.id}
       to={item.href}
       className={`relative flex items-center gap-3 px-4 py-2.5 rounded-full press-scale transition-colors duration-150 ease-premium ${
        activeItem === item.id
         ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
         : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
       }`}
      >
       <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
       <span className="font-label-md text-label-md">{item.label}</span>
      </Link>
     ))}
    </nav>

    <div className="space-y-0.5 px-2 pt-base border-t border-border">
     {bottomItems.map((item) => (
      <Link
       key={item.id}
       to={item.href}
       className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-full press-scale transition-colors duration-150 ease-premium"
      >
       <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
       <span className="font-label-md text-label-md">{item.label}</span>
      </Link>
     ))}
    </div>
   </aside>

   {/* Main Content */}
   <div className="flex-1 flex flex-col min-w-0">
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
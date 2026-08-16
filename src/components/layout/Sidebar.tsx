import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/providers/use-auth"
import { cn } from "@/lib/utils"

interface NavItem {
 icon: string
 label: string
 id: string
 href: string
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
 {
  label: "Overview",
  items: [
   { icon: "dashboard", label: "Dashboard", id: "dashboard", href: "/dashboard" },
   { icon: "calendar_month", label: "Timetable", id: "timetable", href: "/timetable" },
   { icon: "monitoring", label: "Insights", id: "insights", href: "/insights" },
  ],
 },
 {
  label: "Teaching",
  items: [
   { icon: "account_tree", label: "Grades & Levels", id: "grades", href: "/grades" },
   { icon: "school", label: "Sections", id: "classes", href: "/classes" },
   { icon: "assignment", label: "Assignments", id: "assignments", href: "/assignments/new" },
   { icon: "assignment_turned_in", label: "Rubrics", id: "rubrics", href: "/rubrics" },
   { icon: "list_alt", label: "Submissions", id: "submissions", href: "/submissions" },
   { icon: "quiz", label: "Quizzes", id: "quizzes", href: "/quizzes" },
   { icon: "science", label: "Lab Simulations", id: "labs", href: "/labs" },
   { icon: "notifications_active", label: "Alerts", id: "alerts", href: "/alerts" },
  ],
 },
 {
  label: "Communication",
  items: [
   { icon: "chat_bubble", label: "Messages", id: "chat", href: "/chat" },
   { icon: "notifications", label: "Notifications", id: "notifications", href: "/notifications" },
   { icon: "smart_toy", label: "Assistant", id: "assistant", href: "/assistant" },
   { icon: "video_camera_front", label: "Meetings", id: "meetings", href: "/meetings" },
  ],
 },
]

const bottomItems = [{ icon: "contact_support", label: "Help Center", id: "help", href: "/support" }]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
 return (
  <Link
   to={item.href}
   aria-current={active ? "page" : undefined}
   className={cn(
    "group press-scale relative flex items-center gap-3 px-3 py-2 rounded-full transition-all duration-150 ease-premium",
    active
     ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
     : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
   )}
  >
   <span
    className="material-symbols-outlined text-[20px] transition-transform duration-150 group-hover:scale-110"
    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
   >
    {item.icon}
   </span>
   <span className="font-label-md text-label-md font-medium truncate">{item.label}</span>
  </Link>
 )
}

export function Sidebar() {
 const location = useLocation()
 const navigate = useNavigate()
 const { logout } = useAuth()
 const path = location.pathname

 const activeItem = path === "/dashboard" ? "dashboard"
  : path.startsWith("/timetable") ? "timetable"
  : path.startsWith("/classes") ? "classes"
  : path.startsWith("/assignments") ? "assignments"
  : path.startsWith("/rubrics") ? "rubrics"
  : path.startsWith("/submissions") ? "submissions"
  : path.startsWith("/quizzes") ? "quizzes"
  : path.startsWith("/labs") ? "labs"
  : path.startsWith("/alerts") ? "alerts"
  : path.startsWith("/insights") ? "insights"
  : path.startsWith("/chat") ? "chat"
  : path.startsWith("/meetings") ? "meetings"
  : path.startsWith("/notifications") ? "notifications"
  : path.startsWith("/assistant") ? "assistant"
  : path.startsWith("/grades") ? "grades"
  : "dashboard"

 function handleLogout() {
  logout()
  navigate("/login")
 }

 return (
  <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-surface-container-lowest border-r border-surface-container shadow-[4px_0_24px_rgba(164,48,115,0.08)] z-40">
   {/* Brand */}
   <div className="flex items-center gap-3 px-md py-5 shrink-0">
    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
     <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
    </div>
    <div className="min-w-0">
     <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">EduAI</h1>
     <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">School Management</p>
    </div>
   </div>

   {/* Scrollable nav */}
   <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 pb-4">
    {NAV_SECTIONS.map((section) => (
     <div key={section.label} className="space-y-0.5">
      <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
       {section.label}
      </p>
      {section.items.map((item) => (
       <NavLink key={item.id} item={item} active={activeItem === item.id} />
      ))}
     </div>
    ))}
   </nav>

   {/* Bottom Nav */}
   <div className="shrink-0 px-3 py-3 border-t border-border space-y-1">
    {bottomItems.map((item) => (
     <NavLink key={item.id} item={item} active={false} />
    ))}
    <button
     type="button"
     onClick={handleLogout}
     className="group press-scale flex items-center gap-3 px-3 py-2 w-full rounded-full text-on-surface-variant transition-all duration-150 ease-premium hover:bg-error/10 hover:text-error"
    >
     <span className="material-symbols-outlined text-[20px] transition-transform duration-150 group-hover:scale-110">logout</span>
     <span className="font-label-md text-label-md font-medium">Log Out</span>
    </button>
   </div>
  </aside>
 )
}

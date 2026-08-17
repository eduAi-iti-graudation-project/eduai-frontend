import { BellRing, BookOpen, CalendarCheck, CalendarX, CalendarDays, CheckCheck, Clock, Circle, DoorOpen, GraduationCap, HelpCircle, ListChecks, Palette, Presentation, ShieldCheck, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MiniStatProps {
 icon: string
 label: string
 value: number | string
 tone?: "default" | "positive" | "warning" | "danger"
}

const tones = {
 default: "bg-primary-fixed text-on-primary-fixed-variant",
 positive: "bg-success-container text-on-success-container",
 warning: "bg-secondary-fixed text-on-secondary-fixed-variant",
 danger: "bg-error-container text-on-error-container",
}

const iconMap: Record<string, typeof Circle> = {
 notifications_active: BellRing,
 playlist_add_check: ListChecks,
 styles: Palette,
 confirmation_number: CheckCheck,
 event_available: CalendarCheck,
 event_busy: CalendarX,
 schedule: Clock,
 verified_user: ShieldCheck,
 meeting_room: DoorOpen,
 menu_book: BookOpen,
 school: GraduationCap,
 co_present: Presentation,
 groups: Users,
 group: Users,
 quiz: HelpCircle,
 today: CalendarDays,
}

export function MiniStat({ icon, label, value, tone = "default" }: MiniStatProps) {
 const Icon = iconMap[icon] ?? Circle
 return (
  <div className="rounded-md bg-surface-container-low px-3 py-3 min-w-0">
   <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
    <span className={cn("w-6 h-6 shrink-0 rounded flex items-center justify-center", tones[tone])}>
     <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
    </span>
    <span className="font-label-sm text-label-sm truncate">{label}</span>
   </div>
   <p className="font-headline-md text-headline-md text-on-surface tabular-nums mt-1.5">{value}</p>
  </div>
 )
}

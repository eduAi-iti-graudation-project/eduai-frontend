import { cn } from "@/lib/utils"

interface StatCardProps {
 icon: string
 label: string
 value: string | number
 color?: string
 hint?: string
 className?: string
}

export function StatCard({ icon, label, value, color, hint, className }: StatCardProps) {
 return (
  <div className={cn("nudge-hover rounded-xl bg-card p-4 shadow-card", className)}>
   <div
    className={cn(
     "w-9 h-9 rounded-md flex items-center justify-center bg-accent mb-3",
     color ?? "text-primary",
    )}
   >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
   </div>
   <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
   <p className="font-headline-md text-headline-md text-on-surface mt-0.5">{value}</p>
   {hint ? <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{hint}</p> : null}
  </div>
 )
}
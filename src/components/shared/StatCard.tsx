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
    <div className={cn("rounded-[32px] bg-white p-md border border-outline-variant/10 shadow-sm", className)}>
      <span className={cn("material-symbols-outlined text-[22px] mb-2 block", color ?? "text-primary")}>{icon}</span>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-lg text-headline-lg text-on-surface mt-1">{value}</p>
      {hint ? <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{hint}</p> : null}
    </div>
  )
}

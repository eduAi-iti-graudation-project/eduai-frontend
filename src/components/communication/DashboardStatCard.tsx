import { cn } from "@/lib/utils"

interface DashboardStatCardProps {
  icon: string
  label: string
  value: string | number
  color?: string
  className?: string
}

export function DashboardStatCard({ icon, label, value, color, className }: DashboardStatCardProps) {
  return (
    <div className={cn("rounded-lg bg-white p-md border border-border", className)}>
      <span className={cn("material-symbols-outlined text-[22px] mb-2 block", color ?? "text-primary")}>{icon}</span>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-lg text-headline-lg text-on-surface mt-1">{value}</p>
    </div>
  )
}

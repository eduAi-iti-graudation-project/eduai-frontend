import { cn } from "@/lib/utils"

interface MiniStatProps {
  icon: string
  label: string
  value: number | string
  tone?: "default" | "positive" | "warning" | "danger"
}

const tones = {
  default: "bg-primary-fixed text-on-primary-fixed-variant",
  positive: "bg-[#dcfce7] text-[#14532d]",
  warning: "bg-[#fef3c7] text-[#78350f]",
  danger: "bg-[#ffdad6] text-[#93000a]",
}

export function MiniStat({ icon, label, value, tone = "default" }: MiniStatProps) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        <span className={cn("w-5 h-5 rounded flex items-center justify-center", tones[tone])}>
          <span className="material-symbols-outlined text-[13px]">{icon}</span>
        </span>
        <span className="font-label-sm text-label-sm">{label}</span>
      </div>
      <p className="font-headline-md text-headline-md text-on-surface tabular-nums mt-1">{value}</p>
    </div>
  )
}
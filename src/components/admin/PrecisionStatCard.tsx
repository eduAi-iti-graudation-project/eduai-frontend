import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/shared/Sparkline"

interface Delta {
  label: string
  direction: "up" | "down" | "flat"
  tone?: "positive" | "negative" | "neutral"
}

interface PrecisionStatCardProps {
  icon: string
  label: string
  value: string | number
  iconClass?: string
  delta?: Delta
  spark?: number[]
  footer?: ReactNode
  className?: string
}

const deltaTones = {
  positive: "text-[#15803d] bg-[#dcfce7]",
  negative: "text-[#ba1a1a] bg-[#ffdad6]",
  neutral: "text-[#595d75] bg-[#dde1fd]",
}

const deltaGlyph: Record<Delta["direction"], string> = {
  up: "arrow_upward",
  down: "arrow_downward",
  flat: "remove",
}

export function PrecisionStatCard({ icon, label, value, iconClass, delta, spark, footer, className }: PrecisionStatCardProps) {
  return (
    <div className={cn("rounded-xl bg-surface-container-lowest border border-outline-variant p-5 hover:shadow-sm transition-all group", className)}>
<div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconClass ?? "bg-primary-fixed text-on-primary-fixed-variant")}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider truncate">{label}</p>
          </div>
          {delta ? (
            <span
              className={cn(
                "inline-flex items-center gap-px font-label-sm text-[9px] px-1 py-0.5 rounded-md font-medium leading-none shrink-0 whitespace-nowrap",
              deltaTones[delta.tone ?? (delta.direction === "up" ? "positive" : delta.direction === "down" ? "negative" : "neutral")],
            )}
          >
            <span className="material-symbols-outlined text-[8px] leading-none">{deltaGlyph[delta.direction]}</span>
            {delta.label}
          </span>
        ) : null}
      </div>
      <p className="font-headline-lg text-headline-lg text-on-surface tabular-nums leading-none">{value}</p>
      {spark && spark.length > 1 ? (
        <div className="mt-3">
          <Sparkline values={spark} height={24} />
        </div>
      ) : footer ? (
        <div className="mt-3">{footer}</div>
      ) : null}
    </div>
  )
}
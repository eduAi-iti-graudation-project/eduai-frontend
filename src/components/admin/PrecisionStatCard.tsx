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
    <div className={cn("rounded-lg bg-surface-container-lowest border border-outline-variant p-5 hover:shadow-sm transition-all group", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", iconClass ?? "bg-primary-fixed text-on-primary-fixed-variant")}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{label}</p>
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-label-sm text-label-sm px-1.5 py-0.5 rounded-[6px] font-medium",
              deltaTones[delta.tone ?? (delta.direction === "up" ? "positive" : delta.direction === "down" ? "negative" : "neutral")],
            )}
          >
            <span className="material-symbols-outlined text-[13px]">{deltaGlyph[delta.direction]}</span>
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
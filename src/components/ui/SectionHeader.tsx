import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  count?: number
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, count, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-border pb-2 mb-4", className)}>
      <h3 className="font-headline-md text-headline-md font-semibold text-on-surface flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{count}</span>
        )}
      </h3>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

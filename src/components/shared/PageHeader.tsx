import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "hidden md:flex items-center justify-between px-md py-4 bg-surface-container-lowest border-b border-outline-variant/20",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-headline-lg text-headline-lg text-primary truncate">{title}</h1>
        {subtitle ? <p className="font-body-md text-body-md text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
    </header>
  )
}

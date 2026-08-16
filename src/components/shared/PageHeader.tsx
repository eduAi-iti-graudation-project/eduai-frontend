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
  <div className={cn("animate-fade-enter px-6 pt-6 pb-4 flex items-center justify-between gap-4", className)}>
   <div className="min-w-0">
    <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight truncate">
     {title}
    </h1>
    {subtitle ? <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{subtitle}</p> : null}
   </div>
   {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
  </div>
 )
}

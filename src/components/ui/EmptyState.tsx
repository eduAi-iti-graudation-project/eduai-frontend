import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
 icon?: string
 title: string
 description?: string
 action?: ReactNode
 flat?: boolean
 className?: string
}

export function EmptyState({
 icon = "inbox",
 title,
 description,
 action,
 flat = false,
 className,
}: EmptyStateProps) {
 return (
  <Card
   className={cn(
    flat
     ? "border-0 shadow-none bg-transparent"
     : "animate-rise-enter border-0 shadow-none bg-transparent",
    className,
   )}
  >
   <CardContent className="flex flex-col items-center justify-center text-center py-lg">
    <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center mb-4">
     <span className="material-symbols-outlined text-on-surface-variant text-3xl">{icon}</span>
    </div>
    <h3 className="font-headline-md text-headline-md text-primary mb-2">{title}</h3>
    {description && (
     <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
   </CardContent>
  </Card>
 )
}

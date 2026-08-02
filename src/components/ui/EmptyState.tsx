import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-lg", className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl">{icon}</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary mb-2">{title}</h3>
      {description && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

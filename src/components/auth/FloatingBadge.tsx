import { cn } from "@/lib/utils"

interface FloatingBadgeProps {
  icon: string
  iconColor: string
  title: string
  subtitle: string
  position: "left" | "right"
  delay?: number
  className?: string
}

function getPositionClasses(position: "left" | "right") {
  return position === "left"
    ? "top-1/4 left-1/4 animate-float"
    : "bottom-1/4 right-1/4 animate-float-delayed"
}

export function FloatingBadge({
  icon,
  iconColor,
  title,
  subtitle,
  position,
  className,
}: FloatingBadgeProps) {
  return (
    <div
      className={cn(
        "absolute z-20 bg-surface-container-lowest tactile-card p-4 rounded-2xl flex items-center gap-3",
        getPositionClasses(position),
        className,
      )}
    >
      <span className={cn("material-symbols-outlined text-3xl", iconColor)}>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="font-label-md text-on-surface whitespace-nowrap">{title}</span>
        <span className="text-xs text-on-surface-variant whitespace-nowrap">{subtitle}</span>
      </div>
    </div>
  )
}

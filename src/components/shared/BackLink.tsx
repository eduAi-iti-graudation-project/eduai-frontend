import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface BackLinkProps {
  to: string
  label: string
  className?: string
}

export function BackLink({ to, label, className }: BackLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-xs text-on-surface-variant font-label-md hover:text-primary transition-colors",
        className,
      )}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        arrow_back
      </span>
      {label}
    </Link>
  )
}
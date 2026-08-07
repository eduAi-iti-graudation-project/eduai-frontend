import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={className ?? "flex-1 p-md"}>
      <div className="flex flex-col gap-4 max-w-4xl mx-auto" aria-busy="true">
        <Skeleton className="h-8 w-56 rounded-lg bg-surface-container-high" />
        <Skeleton className="h-5 w-80 max-w-full rounded-lg bg-surface-container-high" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg bg-surface-container-high" />
          <Skeleton className="h-24 rounded-lg bg-surface-container-high" />
          <Skeleton className="h-24 rounded-lg bg-surface-container-high" />
        </div>
        <Skeleton className="h-40 rounded-lg bg-surface-container-high" />
        <Skeleton className="h-40 rounded-lg bg-surface-container-high" />
      </div>
      <p className="sr-only">{label}</p>
    </div>
  )
}

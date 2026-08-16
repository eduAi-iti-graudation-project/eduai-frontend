import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
 title?: string
 message?: string
 onRetry?: () => void
 className?: string
}

export function ErrorState({
 title = "Something went wrong",
 message = "Failed to load data",
 onRetry,
 className,
}: ErrorStateProps) {
 return (
  <div className={cn("flex items-center justify-center h-full p-xl", className)}>
   <div className="text-center w-full">
    <span className="material-symbols-outlined text-[48px] text-error mb-md">error</span>
    <h2 className="font-headline-md text-headline-md text-primary mb-sm">{title}</h2>
    <p className="font-body-md text-on-surface-variant mb-lg">{message}</p>
    {onRetry ? (
     <Button
      type="button"
      variant="secondary"
      onClick={onRetry}
      className="rounded-lg font-label-md px-lg py-sm h-auto"
     >
      Try Again
     </Button>
    ) : null}
   </div>
  </div>
 )
}

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "default"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next && !isLoading) onCancel()
    }}>
      <DialogContent className={cn("rounded-[32px] max-w-2xl bg-white", className)}>
        <DialogHeader>
          <div className="flex items-center gap-sm">
            <span
              className={cn(
                "material-symbols-outlined text-[28px]",
                variant === "danger" ? "text-error" : "text-primary",
              )}
            >
              {variant === "danger" ? "warning" : "info"}
            </span>
            <DialogTitle className="font-headline-md text-headline-md text-on-surface">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="font-body-md text-body-md text-on-surface-variant">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-md sm:gap-md">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-auto py-sm font-label-md text-label-md rounded-full"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            variant={variant === "danger" ? "destructive" : "default"}
            className={cn(
              "flex-1 h-auto py-sm font-label-md text-label-md rounded-full",
              variant === "default" && "bg-primary-container text-white hover:bg-primary-container/90",
            )}
          >
            {isLoading ? `${confirmLabel}...` : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

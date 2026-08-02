import { cn } from "@/lib/utils"

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
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={cn(
          "bg-white rounded-[32px] p-xl shadow-xl max-w-2xl w-full mx-md border border-outline-variant/10",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-sm mb-md">
          <span
            className={cn(
              "material-symbols-outlined text-[28px]",
              variant === "danger" ? "text-error" : "text-primary",
            )}
          >
            {variant === "danger" ? "warning" : "info"}
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{message}</p>
        <div className="flex gap-md">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-sm bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-full disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 py-sm font-label-md text-label-md rounded-full disabled:opacity-50 active:scale-95 transition-all",
              variant === "danger"
                ? "bg-error text-on-error"
                : "bg-primary-container text-white",
            )}
          >
            {isLoading ? `${confirmLabel}...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

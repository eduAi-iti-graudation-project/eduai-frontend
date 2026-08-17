import { useOperations } from "@/providers/use-operations"
import type { Operation } from "@/providers/operations-context"

const KIND_ICON: Record<string, string> = {
  "lab-generate": "science",
  "lab-refine": "edit_note",
  "lab-regenerate": "refresh",
  "quiz-generate": "quiz",
  "homework-help": "school",
  "guardian-chat": "family_history",
}

function OperationPill({ operation }: { operation: Operation }) {
  const icon = KIND_ICON[operation.kind] ?? "smart_toy"
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-md">
      <span className="material-symbols-outlined text-[18px] text-primary animate-spin">progress_activity</span>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{icon}</span>
      <span className="font-label-sm text-label-sm text-on-surface">{operation.label}</span>
      {operation.lastToolStep && (
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {operation.lastToolStep.replace(/_/g, " ")}
        </span>
      )}
    </div>
  )
}

/**
 * Persistent, route-independent indicator for long-running AI operations
 * (lab/quiz generation, refinement, homework help). Lives outside the router
 * so it stays visible when the teacher switches tabs; the underlying SSE
 * stream keeps running and keeps updating the operations store.
 */
export function GlobalActivityIndicator() {
  const { operations } = useOperations()
  const running = operations.filter((op) => op.status === "running")
  if (running.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
      {running.map((op) => (
        <OperationPill key={op.id} operation={op} />
      ))}
    </div>
  )
}
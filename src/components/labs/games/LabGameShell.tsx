import type { LabGameSpec } from "@/lib/api"

export function LabGameShell({
  spec,
  won,
  children,
}: {
  spec: LabGameSpec
  won: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-border bg-surface-container-lowest px-4 py-3">
        <p className="font-headline-xs text-headline-xs text-on-surface truncate">{spec.title}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{spec.instructions}</p>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant min-w-0 truncate">Objective: {spec.objective}</p>
        {won && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-label-sm text-label-sm shrink-0">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Objective complete
          </span>
        )}
      </div>
    </div>
  )
}
import { useCallback, useEffect, useRef, useState } from "react"
import { buildLabHarnessHtml } from "./lab-harness"
import { cn } from "@/lib/utils"

export interface LabSimulationFrameProps {
  code: string
  onObjectiveComplete?: () => void
  onRuntimeError?: (message: string) => void
  className?: string
}

export function LabSimulationFrame({
  code,
  onObjectiveComplete,
  onRuntimeError,
  className,
}: LabSimulationFrameProps) {
  const [runId, setRunId] = useState(0)
  const [objectiveMet, setObjectiveMet] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const callbacksRef = useRef({ onObjectiveComplete, onRuntimeError })

  useEffect(() => {
    callbacksRef.current = { onObjectiveComplete, onRuntimeError }
  }, [onObjectiveComplete, onRuntimeError])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // The sandbox has an opaque origin ("null"); never trust the payload
      // beyond the exact internal protocol.
      const data = event.data as { type?: string; event?: string; message?: string } | null
      if (!data || data.type !== "eduai-lab") return
      if (data.event === "objective-complete") {
        setObjectiveMet(true)
        callbacksRef.current.onObjectiveComplete?.()
      } else if (data.event === "runtime-error" && typeof data.message === "string") {
        callbacksRef.current.onRuntimeError?.(data.message)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const restart = useCallback(() => {
    setObjectiveMet(false)
    setRunId((run) => run + 1)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((full) => !full)
  }, [])

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-border bg-white overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-container-lowest border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">science</span>
          <span className="font-label-md text-label-md text-on-surface truncate">Simulation preview</span>
          {objectiveMet && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Objective complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Restart
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white">
        <iframe
          key={runId}
          title="Lab simulation sandbox"
          sandbox="allow-scripts"
          srcDoc={buildLabHarnessHtml(code)}
          className="w-full h-full block"
        />
      </div>
    </div>
  )
}
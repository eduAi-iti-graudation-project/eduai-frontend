import { useEffect } from "react"
import { useProgress } from "@react-three/drei"

/** Blocks scrolling until every model + texture is downloaded. */
export function LoadingGate({ children, onReady }: { children: React.ReactNode; onReady?: () => void }) {
  const { progress, active, errors } = useProgress()

  const failed = errors.length > 0
  const done = !active && progress >= 100
  const ready = done

  useEffect(() => {
    document.documentElement.style.overflow = ready ? "" : "hidden"
    document.body.style.overflow = ready ? "" : "hidden"
    if (ready) onReady?.()
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [ready, onReady])

  return (
    <>
      {children}
      {!ready && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-surface">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          {failed ? (
            <div className="max-w-[36rem] px-6 text-center">
              <p className="font-headline-md text-headline-md text-on-surface">Some assets failed to load</p>
              <p className="mt-2 text-body-md text-on-surface-variant">
                {errors[0].replace(/^https?:\/\/[^/]+/, "")} — verify the file exists and your{" "}
                <code className="rounded bg-surface-container px-1">VITE_LANDING_*</code> env values.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-primary-foreground"
              >
                Reload
              </button>
            </div>
          ) : (
            <div className="w-64">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
              <p className="mt-3 text-center font-mono text-label-md text-on-surface-variant">
                {Math.round(progress)}% — loading the scene
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
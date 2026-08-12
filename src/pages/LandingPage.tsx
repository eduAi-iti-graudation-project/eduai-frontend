import { lazy, Suspense } from "react"

const LandingExperience = lazy(() =>
  import("../landing/LandingExperience").then((m) => ({ default: m.LandingExperience }))
)

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          school
        </span>
        <span className="text-body-md text-on-surface-variant">Loading EduAI…</span>
      </div>
    </div>
  )
}

/**
 * The 3D scroll-story landing. Live only on the `/` guest route, and the whole
 * three.js/gsap/lenis stack ships in this chunk alone — no dashboard page ever
 * downloads it (code-split at the route level).
 */
export function LandingPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <LandingExperience />
    </Suspense>
  )
}
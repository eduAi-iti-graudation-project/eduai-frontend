import { Suspense, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { useLandingScroll } from "./scroll-driver"
import { preloadLandingModels } from "./models"
import { SceneRoot } from "./SceneRoot"
import { SectionOverlays } from "./SectionOverlays"
import { WarpFlash } from "./WarpFlash"
import { NavBar } from "./NavBar"
import { LoadingGate } from "./LoadingGate"
import { LandingErrorBoundary } from "./LandingErrorBoundary"
import { PAGE_HEIGHT_VH } from "./progress"

preloadLandingModels()

/**
 * The scroll-driven 3D story. One fixed full-viewport Canvas; a very tall
 * invisible DOM wrapper owns the wheel; one scroll value drives everything.
 */
export function LandingExperience() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  useLandingScroll(wrapperRef)

  return (
    <>
      <div ref={wrapperRef} className="relative" style={{ height: `${PAGE_HEIGHT_VH}vh` }}>
        {/* sky backdrop behind the canvas so overscroll never flashes */}
        <div className="fixed inset-0 z-0 bg-[#d9e6f6]" />
        <LoadingGate>
          <LandingErrorBoundary>
            <div className="fixed inset-0 z-[1]">
              <Canvas
                dpr={[1, 1.75]}
                camera={{ fov: 45, near: 0.1, far: 200, position: [0, 1.15, 2.75] }}
                gl={{ antialias: true, powerPreference: "high-performance" }}
              >
                <Suspense fallback={null}>
                  <SceneRoot />
                </Suspense>
              </Canvas>
            </div>
          </LandingErrorBoundary>
          {/* section text / UI overlays */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <SectionOverlays />
          </div>
          <WarpFlash />
        </LoadingGate>
      </div>
      <NavBar />
    </>
  )
}
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { localProgress, scrollState, windowed } from "../progress"
import { ENV_Y } from "../scenes"

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Module-scope materials — opacity is scrubbed every frame (mutable singleton).
// Emissive keeps the paper visible even when scene lighting glitches
// (non-emissive materials would render black in that state).
const paperMat = new THREE.MeshStandardMaterial({
  color: "#fff0f6",
  emissive: "#fbd3e6",
  emissiveIntensity: 0.95,
  transparent: true,
  opacity: 0,
})
// Hologram frame — a thin emissive border that holds the translucent sheet.
const frameMat = new THREE.MeshBasicMaterial({
  color: "#ec4899",
  transparent: true,
  opacity: 0,
  toneMapped: false,
})
// Scanline shimmer — thin bars that sweep up the sheet like a digitized readout.
const scanMat = new THREE.MeshBasicMaterial({
  color: "#f9a8d4",
  transparent: true,
  opacity: 0,
  toneMapped: false,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
})

const SHEET_W = 1.5
const SHEET_H = 2

/**
 * The floating test paper — hovers between the camera and the student, now a
 * translucent HOLOGRAM: the sheet is ~45% see-through (pale pink, emissive),
 * bordered by a bright magenta frame with scanlines sweeping up it. The
 * student shows through the sheet, so the paper never hides the hero while
 * still floating in front of them for the depth cue.
 *
 * Scene 6: the student works, then a paper appears and a red X draws itself
 * on it (a signal, not a verdict).
 * Scene 7: the robot arrives, then a fresh paper appears and a green check
 * draws itself on it.
 * Scene 8: no paper — the student celebrates alone in the sky.
 * Paper opacity + both marks are scroll-driven and backwards-safe.
 */
export function TestPaper() {
  const rootRef = useRef<THREE.Group>(null)
  const x1Ref = useRef<THREE.Mesh>(null)
  const x2Ref = useRef<THREE.Mesh>(null)
  const c1Ref = useRef<THREE.Mesh>(null)
  const c2Ref = useRef<THREE.Mesh>(null)
  const scanRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const global = scrollState.value
    const s6 = localProgress(global, 6)
    const s7 = localProgress(global, 7)

    // paper presence: test-1 paper in scene 6 (after the solve), test-2 paper
    // in scene 7 (after the robot arrives), gone by the celebration
    const in6 =
      clamp01(windowed(s6, 0.18, 0.3)) * (1 - clamp01(windowed(s6, 0.9, 0.98)))
    const in7 =
      clamp01(windowed(s7, 0.3, 0.44)) * (1 - clamp01(windowed(s7, 0.92, 0.99)))
    const alpha = clamp01(in6 + in7)
    paperMat.opacity = alpha * 0.45
    frameMat.opacity = alpha * 0.95
    scanMat.opacity = alpha * 0.55

    // draw marks with a slight stagger — the X only lives on the test-1 paper,
    // so the fresh test-2 paper never shows it
    const x1 = in6 * clamp01(windowed(s6, 0.32, 0.52))
    const x2 = in6 * clamp01(windowed(s6, 0.4, 0.6))
    const c1 = in7 * clamp01(windowed(s7, 0.5, 0.68))
    const c2 = in7 * clamp01(windowed(s7, 0.6, 0.78))
    if (x1Ref.current) x1Ref.current.scale.set(1, x1, 1)
    if (x2Ref.current) x2Ref.current.scale.set(1, x2, 1)
    if (c1Ref.current) c1Ref.current.scale.set(1, c1, 1)
    if (c2Ref.current) c2Ref.current.scale.set(1, c2, 1)

    // scanlines sweep upward across the translucent sheet
    const span = SHEET_H + 0.6
    scanRefs.current.forEach((m, i) => {
      if (m) m.position.y = ((t * (0.35 + i * 0.14) + i * 0.8) % span) - span / 2
    })

    if (rootRef.current) {
      const envY = ENV_Y.school
      rootRef.current.position.set(0, envY + 1.5 + Math.sin(t * 1.8) * 0.06, 1.1)
      rootRef.current.rotation.y = Math.sin(t * 0.5) * 0.12
      rootRef.current.rotation.z = Math.sin(t * 1.1) * 0.02
    }
  })

  const halfW = SHEET_W / 2
  const halfH = SHEET_H / 2
  const frameW = SHEET_W + 0.08
  const frameH = SHEET_H + 0.08

  return (
    <group ref={rootRef} position={[0, 1.5, 1.1]}>
      {/* translucent hologram sheet — the student shows through */}
      <mesh material={paperMat}>
        <planeGeometry args={[SHEET_W, SHEET_H]} />
      </mesh>

      {/* hologram frame — four thin emissive border bars */}
      {[
        { position: [0, halfH + 0.04, 0.01], size: [frameW, 0.045, 0.02] },
        { position: [0, -halfH - 0.04, 0.01], size: [frameW, 0.045, 0.02] },
        { position: [-halfW - 0.04, 0, 0.01], size: [0.045, frameH, 0.02] },
        { position: [halfW + 0.04, 0, 0.01], size: [0.045, frameH, 0.02] },
      ].map((bar, i) => (
        <mesh key={i} material={frameMat} position={bar.position as [number, number, number]}>
          <boxGeometry args={bar.size as [number, number, number]} />
        </mesh>
      ))}

      {/* scanline shimmer — swept up the sheet in useFrame */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            scanRefs.current[i] = el
          }}
          material={scanMat}
          position={[0, 0, 0.02]}
        >
          <planeGeometry args={[SHEET_W - 0.24, 0.03]} />
        </mesh>
      ))}

      {/* red X — two crossed bars, draw-on for test 1 */}
      <mesh ref={x1Ref} position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.09, 1.5, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={x2Ref} position={[0, 0, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.09, 1.5, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.35} />
      </mesh>

      {/* green check — two strokes, draw-on for test 2 */}
      <mesh ref={c1Ref} position={[-0.315, -0.05, 0.03]} rotation={[0, 0, Math.atan2(0.47, 0.4)]}>
        <boxGeometry args={[0.11, 0.617, 0.05]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={c2Ref} position={[0.27, -0.3, 0.03]} rotation={[0, 0, Math.atan2(0.7, -0.9)]}>
        <boxGeometry args={[0.11, 1.141, 0.05]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
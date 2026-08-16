import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { bandAt, ENV_BY_BAND, heightAt } from "../scenes"
import { scrollState } from "../progress"

const COUNT = 150
const PETAL_COLORS = ["#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#ffe4f1"]
const WIDE = 13
const FALL_SPAN = 14
const FALL_CENTER = 2.2

/** Deterministic pseudo-random 0..1 from an index — no runtime state needed. */
const rand = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

interface Petal {
  x: number
  y0: number
  z: number
  size: number
  fallRate: number
  sway: number
  swaySpeed: number
  phase: number
  spin: number
  spinSpeed: number
  color: THREE.Color
}

// Module-scope, fully deterministic. Each petal drifts down with a sideways
// sway and lazy tumbling — the classic sakura fall. Loop: a petal that falls
// past the bottom wraps back to the top with the same trajectory.
const petals: Petal[] = Array.from({ length: COUNT }, (_, i) => ({
  x: (rand(i * 1.7) - 0.5) * WIDE,
  y0: rand(i * 2.3) * FALL_SPAN,
  z: -8 + rand(i * 3.1) * 10,
  size: 0.07 + rand(i * 4.5) * 0.09,
  fallRate: 0.7 + rand(i * 5.9) * 1.2,
  sway: 0.5 + rand(i * 6.7) * 1.3,
  swaySpeed: 0.6 + rand(i * 7.1) * 1.2,
  phase: rand(i * 8.3) * Math.PI * 2,
  spin: rand(i * 9.1) * Math.PI,
  spinSpeed: 1 + rand(i * 10.3) * 3,
  color: new THREE.Color(PETAL_COLORS[i % PETAL_COLORS.length]),
}))

const petalGeo = new THREE.PlaneGeometry(1, 0.62)
const petalMesh = new THREE.InstancedMesh(
  petalGeo,
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  }),
  COUNT
)
petalMesh.count = COUNT
{
  const dummy = new THREE.Object3D()
  petals.forEach((p, i) => {
    dummy.position.set(p.x, 0, p.z)
    dummy.scale.setScalar(0.0001)
    dummy.updateMatrix()
    petalMesh.setMatrixAt(i, dummy.matrix)
    petalMesh.setColorAt(i, p.color)
  })
  petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  petalMesh.instanceMatrix.needsUpdate = true
  if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true
}

/**
 * Falling cherry-blossom petals — the anime touch. A field of soft pink
 * petals drifts through the outdoor chapters (sky, gate, finale) and goes
 * quiet the moment the student steps inside the school — indoors, the petals
 * stop. They also stay hidden in the dark portal/tunnel chapters where they
 * would read as noise.
 */
export function Sakura() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const global = scrollState.value

    if (groupRef.current) {
      const env = ENV_BY_BAND[bandAt(global)]
      groupRef.current.visible = env === "skyA" || env === "gate" || env === "skyB"
      groupRef.current.position.y = heightAt(global)
    }

    const dummy = new THREE.Object3D()
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i]
      // fall + wrap; sideways sway; lazy tumble
      const y = (((p.y0 - t * p.fallRate) % FALL_SPAN) + FALL_SPAN) % FALL_SPAN - FALL_SPAN / 2 + FALL_CENTER
      const x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.sway
      dummy.position.set(x, y, p.z)
      dummy.rotation.set(Math.sin(t * p.spinSpeed * 0.6 + p.phase) * 0.7, t * p.spinSpeed * 0.4 + p.spin, Math.sin(t * p.spinSpeed * 0.8 + p.phase) * 0.9)
      dummy.scale.setScalar(p.size)
      dummy.updateMatrix()
      petalMesh.setMatrixAt(i, dummy.matrix)
    }
    petalMesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <primitive object={petalMesh} />
    </group>
  )
}
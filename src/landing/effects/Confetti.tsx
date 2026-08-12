import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { localProgress, scrollState } from "../progress"

const COUNT = 220
const COLORS = ["#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#fb7185"]
const LOCAL_Y_MIN = -2
const LOCAL_Y_MAX = 8

/** Deterministic pseudo-random 0..1 from an index — no runtime state needed. */
const rand = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

interface ConfettiPiece {
  x: number
  y: number
  z: number
  size: number
  speed: number
  sway: number
  phase: number
  spin: number
  color: THREE.Color
}

// Module-scope, fully deterministic: assembled once, animated in useFrame.
// (Same mutable-singleton pattern as the scroll driver — never React state.)
const items: ConfettiPiece[] = Array.from({ length: COUNT }, (_, i) => ({
  x: (rand(i * 7.31) - 0.5) * 12,
  y: LOCAL_Y_MIN + rand(i * 3.17) * (LOCAL_Y_MAX - LOCAL_Y_MIN),
  z: (rand(i * 11.9) - 0.5) * 8 - 2,
  size: 0.05 + rand(i * 5.77) * 0.07,
  speed: 0.7 + rand(i * 2.41) * 0.8,
  sway: 0.6 + rand(i * 4.93) * 1.4,
  phase: rand(i * 8.63) * Math.PI * 2,
  spin: (rand(i * 6.29) - 0.5) * 4,
  color: new THREE.Color(COLORS[i % COLORS.length]),
}))

const confettiMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial(), COUNT)
confettiMesh.count = COUNT
{
  const dummy = new THREE.Object3D()
  items.forEach((item, i) => {
    dummy.position.set(item.x, item.y, item.z)
    dummy.scale.setScalar(item.size)
    dummy.updateMatrix()
    confettiMesh.setMatrixAt(i, dummy.matrix)
    confettiMesh.setColorAt(i, item.color)
  })
  confettiMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  confettiMesh.instanceMatrix.needsUpdate = true
  if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true
}

/**
 * Celebration confetti — one instanced box cloud falling + swaying in the
 * finale sky (scene 8). Rendered only while the skyB pocket is visible, so
 * it costs nothing outside the celebration.
 */
export function Confetti() {
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    // the celebration settles once the pricing cards arrive
    const p9 = localProgress(scrollState.value, 9)
    const fallRate = 1 - Math.min(1, p9 * 3)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      item.y -= item.speed * delta * fallRate
      if (item.y < LOCAL_Y_MIN) item.y = LOCAL_Y_MAX
      dummy.position.set(
        item.x + Math.sin(t * item.sway + item.phase) * 0.8,
        item.y,
        item.z + Math.cos(t * item.sway * 0.8 + item.phase) * 0.5
      )
      dummy.rotation.set(t * item.spin, t * item.spin * 0.7, t * item.spin * 1.2)
      dummy.scale.setScalar(item.size)
      dummy.updateMatrix()
      confettiMesh.setMatrixAt(i, dummy.matrix)
    }
    confettiMesh.instanceMatrix.needsUpdate = true
  })

  return <primitive object={confettiMesh} />
}

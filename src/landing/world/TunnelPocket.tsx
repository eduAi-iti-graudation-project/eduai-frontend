import { useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const COUNT = 260
const Z_MIN = -0.5
const Z_MAX = -14
const SPAN = Z_MAX - Z_MIN

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The portal tunnel (scene 4): light streaks rushing toward the camera while
 * the student floats center-frame. Positions mutate per frame in a ref —
 * pure object choreography, no re-renders.
 */
export function TunnelPocket() {
  const geometry = useMemo(() => {
    const rand = mulberry32(20260813)
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const angle = rand() * Math.PI * 2
      const r = 1.9 + rand() * 2.6
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.sin(angle) * r * 0.85 + 0.4
      positions[i * 3 + 2] = Z_MIN + rand() * SPAN
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  const speeds = useMemo(() => {
    const rand = mulberry32(20260812)
    const a = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) a[i] = 3.2 + rand() * 6.5
    return a
  }, [])

  useFrame((_, delta) => {
    const attr = geometry.getAttribute("position")
    const arr = attr.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 2] += speeds[i] * delta
      if (arr[i * 3 + 2] > Z_MIN) arr[i * 3 + 2] -= SPAN
    }
    attr.needsUpdate = true
  })

  return (
    <group>
      {/* tunnel mouth glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, Z_MAX]}>
        <circleGeometry args={[4.6, 48]} />
        <meshBasicMaterial color="#7f1350" transparent opacity={0.65} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, Z_MAX - 0.05]}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial color="#ff9ecb" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {/* rushing light streaks */}
      <points geometry={geometry}>
        <pointsMaterial
          color="#f472b6"
          size={0.085}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

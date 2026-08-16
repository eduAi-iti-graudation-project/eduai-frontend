import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { localProgress, scrollState, windowed } from "../progress"

const RING_RADIUS = 2.2
const SPARK_COUNT = 420
const SPARK_COLORS = ["#ffafd3", "#ffd8e7", "#f05e9e", "#40c2fd", "#c4e7ff"]

/** Deterministic pseudo-random 0..1 from an index — no runtime state needed. */
const rand = (n: number) => {
 const s = Math.sin(n * 12.9898) * 43758.5453
 return s - Math.floor(s)
}

/**
 * A 4-point sparkle cross: two thin rectangles crossed in the XY plane
 * (indexed, 8 verts). No textures — a real geometry, safe on every GPU.
 */
function makeSparkleGeometry(halfLength: number, halfWidth: number): THREE.BufferGeometry {
 const geo = new THREE.BufferGeometry()
 const positions = new Float32Array([
  halfLength, halfWidth, 0, -halfLength, halfWidth, 0, -halfLength, -halfWidth, 0,
  halfLength, halfWidth, 0, -halfLength, -halfWidth, 0, halfLength, -halfWidth, 0,
  halfWidth, halfLength, 0, -halfWidth, halfLength, 0, -halfWidth, -halfLength, 0,
  halfWidth, halfLength, 0, -halfWidth, -halfLength, 0, halfWidth, -halfLength, 0,
 ])
 const uvs = new Float32Array(new Array(24).fill(0.5))
 const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]
 geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
 geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
 geo.setIndex(indices)
 geo.computeVertexNormals()
 return geo
}

interface Spark {
 angle: number
 spiral: number
 tiltY: number
 burst: number
 z0: number
 zDrift: number
 size: number
 rate: number
 phase: number
 twinkle: number
 color: THREE.Color
}

// Module-scope, fully deterministic. Each sparkle runs a continuous life
// cycle: born at the portal mouth, spirals outward, shrinks, dies — the next
// one immediately emits. Sin-shaped scale makes emergence + dissolve seamless.
const sparks: Spark[] = Array.from({ length: SPARK_COUNT }, (_, i) => ({
 angle: rand(i * 7.31) * Math.PI * 2,
 spiral: 1.6 + rand(i * 2.9) * 2.4,
 tiltY: (rand(i * 4.7) - 0.5) * 0.5,
 burst: 2.6 + rand(i * 5.3) * 1.9,
 z0: (rand(i * 6.1) - 0.5) * 1.1,
 zDrift: (rand(i * 3.9) - 0.4) * 1.2,
 size: 0.035 + rand(i * 9.13) * 0.05,
 rate: 0.35 + rand(i * 2.41) * 0.4,
 phase: rand(i * 8.63),
 twinkle: 2.5 + rand(i * 5.9) * 4,
 color: new THREE.Color(SPARK_COLORS[i % SPARK_COLORS.length]),
}))

const sparkleGeo = makeSparkleGeometry(1, 0.14)
const sparkleMesh = new THREE.InstancedMesh(
 sparkleGeo,
 new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide }),
 SPARK_COUNT
)
sparkleMesh.count = SPARK_COUNT
{
 const dummy = new THREE.Object3D()
 sparks.forEach((s, i) => {
  dummy.position.set(0, 0, s.z0)
  dummy.scale.setScalar(0.0001)
  dummy.updateMatrix()
  sparkleMesh.setMatrixAt(i, dummy.matrix)
  sparkleMesh.setColorAt(i, s.color)
 })
 sparkleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
 sparkleMesh.instanceMatrix.needsUpdate = true
 if (sparkleMesh.instanceColor) sparkleMesh.instanceColor.needsUpdate = true
}

/**
 * The dream portal — pink and sky, seamless with the pastel scene:
 * a solid disc mouth, two flat green rims, and a continuous SPARKLE EMISSION
 * — 4-point star crosses born at the mouth, spiraling outward, shrinking to
 * nothing, forever re-emitting. Opaque primitives only: no textures, no
 * shaders, no transparency.
 */
export function PortalPocket() {
 const groupRef = useRef<THREE.Group>(null)
 const lightRef = useRef<THREE.PointLight>(null)
 const rimMaterials = useMemo(
  () => [new THREE.Color("#f05e9e"), new THREE.Color("#40c2fd")].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })),
  []
 )

 useFrame(({ clock }) => {
  const t = clock.elapsedTime
  const s3 = localProgress(scrollState.value, 3)
  const grow = 0.7 + windowed(s3, 0.15, 0.95) * 0.3
  if (groupRef.current) groupRef.current.scale.setScalar(grow)
  if (lightRef.current) {
   lightRef.current.intensity = 6 + Math.sin(t * 3) * 1.2 + s3 * 5
  }

  const dummy = new THREE.Object3D()
  for (let i = 0; i < sparks.length; i++) {
   const s = sparks[i]
   const life = (t * s.rate + s.phase) % 1
   const q = life
   const a = s.angle + q * s.spiral
   const r = q * s.burst
   const growF = Math.sin(Math.PI * q)
   dummy.position.set(
    Math.cos(a) * r,
    Math.sin(a) * r * 0.9 + s.tiltY + Math.sin(t * 1.3 + s.angle) * 0.08,
    s.z0 + q * s.zDrift
   )
   dummy.rotation.set(t * s.twinkle * 0.6, t * s.twinkle * 0.4, t * s.twinkle)
   dummy.scale.setScalar(s.size * (0.35 + growF))
   dummy.updateMatrix()
   sparkleMesh.setMatrixAt(i, dummy.matrix)
  }
  sparkleMesh.instanceMatrix.needsUpdate = true
 })

 return (
  <group ref={groupRef} position={[0, 0.9, -8.5]}>
   {/* solid portal mouth — blends into the luminous scene */}
   <mesh position={[0, 0, -0.1]}>
    <circleGeometry args={[RING_RADIUS - 0.25, 64]} />
    <meshBasicMaterial color="#0f6b36" toneMapped={false} />
   </mesh>
   {/* outer green rim */}
   <mesh material={rimMaterials[0]}>
    <ringGeometry args={[RING_RADIUS - 0.25, RING_RADIUS + 0.25, 96]} />
   </mesh>
   {/* inner bright rim */}
   <mesh material={rimMaterials[1]} position={[0, 0, 0.05]}>
    <ringGeometry args={[RING_RADIUS * 0.86, RING_RADIUS - 0.25, 80]} />
   </mesh>
   {/* emitted sparkles — born at the mouth, spiraling outward, forever */}
   <primitive object={sparkleMesh} />
   <pointLight ref={lightRef} color="#f05e9e" intensity={7} distance={22} decay={2} position={[0, 0, 0.4]} />
  </group>
 )
}
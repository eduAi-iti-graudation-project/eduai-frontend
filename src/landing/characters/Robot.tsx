import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useCharacterModel } from "../models"
import { landingConfig } from "../config"
import { heroState } from "../scenes"
import { localProgress, scrollState, windowed } from "../progress"
import { robotState } from "../view-state"

const STATION: readonly [number, number, number] = [1.0, 0, -0.9] // beside-right of the student, fully in frame
const BASE_Y = 0.68
const SLIDE_START: readonly [number, number, number] = [4.4, 0, -0.9]

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * The AI tutor robot — static mesh given life procedurally (no animation
 * clips in the GLB). Slides in from the right as scene 7 begins, rotates to
 * face the student, hovers gently beside it, and its core pulses while it
 * talks.
 */
export function Robot() {
  const { scene } = useCharacterModel(landingConfig.modelRobot)
  const sceneRef = useRef(scene)
  const rootRef = useRef<THREE.Group>(null)
  const pulse = useRef(0)
  const coreMaterial = useRef<THREE.MeshStandardMaterial | null>(null)
  const facing = useRef(0)

  // normalize unknown model scale so the robot reads ~0.55m tall
  useEffect(() => {
    const s = sceneRef.current
    const box = new THREE.Box3().setFromObject(s)
    const size = new THREE.Vector3()
    box.getSize(size)
    const tallest = Math.max(size.x, size.y, size.z)
    if (tallest > 0 && tallest !== 0.55) {
      s.scale.setScalar(0.55 / tallest)
    }
    s.position.y = BASE_Y

    s.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && /eye|core|light|visor|screen|emiss/i.test(mesh.name)) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat && "emissive" in mat) {
          mat.emissive = new THREE.Color("#7c4dff")
          mat.emissiveIntensity = 0.5
          coreMaterial.current = mat
        }
      }
    })

    // Lighting-independent look for the body: unlit standard materials render
    // pure black when scene lighting glitches, so give the hull a soft glow
    // (materials that already carry emissive — eyes/core — are left alone).
    s.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of materials) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat.emissive || mat.emissive.getHex() !== 0) continue
        mat.emissive.copy(mat.color).multiplyScalar(0.55)
        mat.emissiveIntensity = 0.6
      }
    })
  }, [])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const global = scrollState.value
    const s7 = localProgress(global, 7)
    const talking = windowed(s7, 0.15, 0.85)
    const s = sceneRef.current

    if (rootRef.current) {
      // slide in from off-frame, then hover gently beside the student
      const arrive = ease(windowed(s7, 0.02, 0.2))
      rootRef.current.position.set(
        SLIDE_START[0] + (STATION[0] - SLIDE_START[0]) * arrive,
        STATION[1] + Math.sin(t * 2) * 0.05,
        STATION[2]
      )

      // face the student: the model's face/nose is its -z side, so aim that
      // side (rotation.y + PI) along the vector to the student
      const robotWorld = rootRef.current.getWorldPosition(new THREE.Vector3())
      const toStudent = new THREE.Vector3(heroState.pos.x - robotWorld.x, 0, heroState.pos.z - robotWorld.z)
      const target = Math.atan2(toStudent.x, toStudent.z) + Math.PI
      facing.current += (target - facing.current) * Math.min(1, delta * 3)
      rootRef.current.rotation.y = facing.current + Math.sin(t * 0.8) * 0.08
      rootRef.current.rotation.z = 0.05
      rootRef.current.getWorldPosition(robotState.pos)
    }

    s.position.y = BASE_Y + Math.sin(t * 2.2) * (0.03 + talking * 0.03)
    s.rotation.y = Math.sin(t * 0.5) * 0.08

    pulse.current = THREE.MathUtils.lerp(pulse.current, talking, Math.min(1, delta * 4))
    const idleShimmer = 0.5 + Math.sin(t * 2.4) * 0.1
    if (coreMaterial.current) {
      coreMaterial.current.emissiveIntensity = idleShimmer + pulse.current * 5
    }
  })

  return (
    <group ref={rootRef} position={SLIDE_START}>
      <primitive object={scene} />
    </group>
  )
}

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { landingConfig } from "../config"
import { localProgress, scrollState } from "../progress"
import { studentClips } from "../models"
import { useClipBank, useRiggedCharacter } from "./Humanoid"
import { bandAt, heightAt, heroState, SCENES } from "../scenes"

type State = "wave" | "fall" | "walk" | "point" | "celebrate"

/**
 * Dream-narrative student. Per scene (student_2.glb clips):
 * s0 hello → waving · s1 → falling (the fall) · s2 → walking in ·
 * s3/s4 → falling (portals) · s5 → falling (school drop) ·
 * s6/s7 → pointing at the holographic paper (solving) · s8/s9 → victory
 * (celebration + pricing finale). Faces the camera per scene; world Y is the
 * shared story height (falls/rises with the camera).
 */
export function Student() {
 const { scene, animations, rootRef, mixerRef } = useRiggedCharacter(landingConfig.modelStudent)
 const clips = useMemo(() => studentClips(animations), [animations])
 const bank = useClipBank(mixerRef, clips)

 const stateRef = useRef<State>("wave")
 const tmp = useRef(new THREE.Vector3())

 useEffect(() => {
  bank.fadeIn("wave", 0)
 }, [bank])

 useFrame(({ clock }) => {
  const t = clock.elapsedTime
  const global = scrollState.value
  const band = bandAt(global)
  const s2 = localProgress(global, 2)

  const floating = band === 1 || band === 3 || band === 4 || band === 5

  let next: State
  if (band === 0) next = "wave"
  else if (band === 1) next = "fall"
  else if (band === 2) next = "walk"
  else if (band === 3 || band === 4) next = "fall"
  else if (band === 5) next = "fall"
  else if (band === 6 || band === 7) next = "point"
  else next = "celebrate"

  if (next !== stateRef.current) {
   stateRef.current = next
   bank.fadeIn(next, 0.4)
  }

  // ── world placement: story height + float bob; drift into the gate / toward the ring ──
  const root = rootRef.current
  if (root) {
   const bob = floating ? Math.sin(t * 2.1) * 0.07 : Math.sin(t * 1.4) * 0.015
   const walkDrift = band === 2 ? s2 * s2 * (3 - 2 * s2) * 2.5 : 0
   const s3 = localProgress(global, 3)
   const drift = band === 3 ? -(s3 * s3 * (3 - 2 * s3)) * 1.8 : walkDrift
   // pricing finale: step back and aside so the plan cards own the frame
   const p9 = localProgress(global, 9)
   const ease9 = p9 * p9 * (3 - 2 * p9)
   tmp.current.set(ease9 * 1.6, heightAt(global) + bob + ease9 * 0.7, drift - ease9 * 1.9)
   root.position.copy(tmp.current)
   root.rotation.z = floating ? Math.sin(t * 1.3) * 0.05 : 0
   heroState.pos.copy(root.position)
  }

  // ── orientation: face the camera — except the tunnel (back to lens) and
  // the gate walk-in (facing away, into the gate, camera behind) ──
  if (root) {
   const targetY =
    band === 2 ? 0 : band === 4 ? Math.PI : Math.atan2(SCENES[band].camPos[0], SCENES[band].camPos[2])
   root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, targetY, 0.12)
  }
 })

 return (
  <group ref={rootRef} position={[0, 0, 0]}>
   {/* the model is authored facing -X (left); +90° makes it face +Z so the
       camera-facing logic in useFrame orients it correctly */}
   <group rotation={[0, Math.PI / 2, 0]}>
    <primitive object={scene} />
   </group>
  </group>
 )
}

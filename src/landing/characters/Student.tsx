import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { landingConfig } from "../config"
import { localProgress, scrollState } from "../progress"
import { studentClips } from "../models"
import { useClipBank, useRiggedCharacter } from "./Humanoid"
import { bandAt, heightAt, heroState, SCENES } from "../scenes"

type State = "wave" | "float" | "walk" | "idle" | "celebrate"

/**
 * Dream-narrative student. Per scene:
 *  s0 hello → wave · s1/s3/s4/s5 → t-pose float (falls + portals + the
 *  school drop) · s2 → walk in · s6/s7 → stand (tests + robot talk) ·
 *  s8 → celebrate. Faces the camera per scene; world Y is the shared story
 *  height (falls/rises with the camera).
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
    if (floating) next = "float"
    else if (band === 0) next = "wave"
    else if (band === 2) next = "walk"
    else if (band === 8) next = "celebrate"
    else next = "idle"

    if (next !== stateRef.current) {
      stateRef.current = next
      if (next === "wave" || next === "float" || next === "walk") bank.fadeIn(next, 0.4)
      else if (next === "celebrate") bank.fadeIn("celebrate", 0.5)
      else bank.fadeIn("idle", 0.5)
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
      <primitive object={scene} />
    </group>
  )
}

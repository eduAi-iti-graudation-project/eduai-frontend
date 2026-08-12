import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { bandAt, heroState, SCENE_CAM_POS, SCENE_CAM_TARGET } from "./scenes"
import { localProgress, scrollState } from "./progress"
import { viewState } from "./view-state"

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * Character-centered camera: locked to the student every frame. Position and
 * aim are scene offsets added to the student's live position — the hero is
 * always center-frame by construction. Runs after the Student publishes its
 * position (useFrame priority 2 > 0).
 *
 * Every env swap is masked by the warp flash AND a camera dolly: during the
 * first 30% of each band the framing eases from the previous scene's shot to
 * this one's, so nothing snaps at the boundary. A tiny decaying dip on the
 * gate band reads as the landing settling after the fall.
 */
export function CameraRig() {
  const { camera } = useThree()

  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const from = useRef(new THREE.Vector3())
  const to = useRef(new THREE.Vector3())

  useFrame(() => {
    const global = scrollState.value
    const band = bandAt(global)

    if (band === 0) {
      pos.current.copy(heroState.pos).add(SCENE_CAM_POS[0])
      look.current.copy(heroState.pos).add(SCENE_CAM_TARGET[0])
    } else {
      const p = localProgress(global, band)
      const blend = ease(Math.min(1, Math.max(0, p / 0.3)))
      from.current.copy(heroState.pos).add(SCENE_CAM_POS[band - 1])
      to.current.copy(heroState.pos).add(SCENE_CAM_POS[band])
      pos.current.lerpVectors(from.current, to.current, blend)
      from.current.copy(heroState.pos).add(SCENE_CAM_TARGET[band - 1])
      to.current.copy(heroState.pos).add(SCENE_CAM_TARGET[band])
      look.current.lerpVectors(from.current, to.current, blend)
    }

    // landing settle on the gate band: one soft dip, then recover
    const s2 = localProgress(global, 2)
    const t = Math.min(1, Math.max(0, s2 / 0.25))
    if (t > 0 && t < 1) {
      pos.current.y -= 0.5 * Math.sin(Math.PI * t) * (1 - 0.35 * t)
    }

    camera.position.copy(pos.current)
    camera.lookAt(look.current)
    viewState.camera = camera
  }, 2)

  return null
}

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useCharacterModel } from "../models"

/**
 * Rigs one cloned GLB: owns its AnimationMixer (one real-delta update per
 * frame at default priority) and auto-positions the root.
 *
 * Why not drei's useAnimations: we need scrubbed actions whose `time` is set
 * BEFORE the single mixer update every frame, plus triggered clips sharing the
 * same clock — owning the mixer makes that ordering deterministic.
 */
export function useRiggedCharacter(url: string) {
  const { scene, animations } = useCharacterModel(url)
  const rootRef = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const mixer = new THREE.AnimationMixer(rootRef.current)
    mixerRef.current = mixer
    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
    }
  }, [url])

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
  }, 1)

  return useMemo(() => ({ scene, animations, rootRef, mixerRef }), [scene, animations])
}

/** Mutable clip registry driving weight crossfades. */
export type ClipBank = ReturnType<typeof useClipBank>

export function useClipBank(mixerRef: React.RefObject<THREE.AnimationMixer | null>, clips: ThreeClipMap) {
  const actions = useRef(new Map<string, THREE.AnimationAction>())

  useEffect(() => {
    actions.current.clear()
    if (!mixerRef.current) return
    for (const [name, clip] of Object.entries(clips)) {
      if (!clip) continue
      actions.current.set(name, mixerRef.current.clipAction(clip))
    }
  }, [mixerRef, clips])

  function fadeIn(name: string, fade = 0.35) {
    const target = actions.current.get(name)
    if (!target) return
    actions.current.forEach((action, key) => {
      if (key !== name) action.fadeOut(fade)
    })
    target.setLoop(THREE.LoopRepeat, Infinity)
    target.reset().fadeIn(fade).play()
  }

  /** One-shot: plays once and holds the final pose until replaced. */
  function playOnce(name: string, fade = 0.35) {
    const target = actions.current.get(name)
    if (!target) return
    actions.current.forEach((action, key) => {
      if (key !== name) action.fadeOut(fade)
    })
    target.setLoop(THREE.LoopOnce, 1)
    target.clampWhenFinished = true
    target.reset().fadeIn(fade).play()
  }

  /** Scroll-scrub: pause the action's clock, set its pose time manually. */
  function scrub(name: string, progress: number) {
    const action = actions.current.get(name)
    if (!action) return
    if (!action.paused) action.paused = true
    action.time = THREE.MathUtils.clamp(progress, 0, 1) * action.getClip().duration
  }

  function pauseAll() {
    actions.current.forEach((a) => a.fadeOut(0.2))
  }

  return useMemo(
    () => ({ actions, fadeIn, playOnce, scrub, pauseAll }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mixerRef, clips]
  )
}

export type ThreeClipMap = Record<string, THREE.AnimationClip | undefined>
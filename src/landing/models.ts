import { useMemo } from "react"
import * as THREE from "three"
import { useGLTF } from "@react-three/drei"
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js"
import { ALL_LANDING_MODELS, landingConfig } from "./config"

export interface LoadedCharacter {
  scene: THREE.Object3D
  animations: THREE.AnimationClip[]
}

/** Find a clip by env-configured name; throws a descriptive error if missing. */
export function findClip(animations: THREE.AnimationClip[], name: string, file: string): THREE.AnimationClip {
  const clip = animations.find((c) => c.name === name)
  if (!clip) {
    const available = animations.map((c) => c.name).join(", ") || "(none)"
    throw new Error(`Landing: clip "${name}" not found in ${file}. Available: ${available}. Set VITE_LANDING_CLIP_* in .env.local to match your export.`)
  }
  return clip
}

/** Load + clone (SkeletonUtils) a character model. Never reuse a shared skinned instance. */
export function useCharacterModel(url: string): LoadedCharacter {
  const gltf = useGLTF(url)
  return useMemo(
    () => ({ scene: cloneSkeleton(gltf.scene), animations: gltf.animations }),
    [gltf]
  )
}

/** Resolves the model paths + clip names once; also web-preloads every model. */
export function preloadLandingModels() {
  ALL_LANDING_MODELS.forEach((url) => useGLTF.preload(url))
}

export function studentClips(animations: THREE.AnimationClip[]) {
  const c = landingConfig.studentClips
  return {
    idle: findClip(animations, c.idle, landingConfig.modelStudent),
    wave: findClip(animations, c.wave, landingConfig.modelStudent),
    walk: findClip(animations, c.walk, landingConfig.modelStudent),
    float: findClip(animations, c.float, landingConfig.modelStudent),
    sit: findClip(animations, c.sit, landingConfig.modelStudent),
    think: findClip(animations, c.think, landingConfig.modelStudent),
    celebrate: findClip(animations, c.celebrate, landingConfig.modelStudent),
  }
}

export function parentClips(animations: THREE.AnimationClip[]) {
  const c = landingConfig.parentClips
  return {
    idle: findClip(animations, c.idle, landingConfig.modelParentA),
    clap: findClip(animations, c.clap, landingConfig.modelParentA),
  }
}
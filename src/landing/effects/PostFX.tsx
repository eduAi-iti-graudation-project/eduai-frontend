import * as THREE from "three"
import { BlendFunction } from "postprocessing"
import { EffectComposer, ChromaticAberration, Noise, Vignette } from "@react-three/postprocessing"

/**
 * Cinematic frame polish. Deliberately avoids Bloom — an earlier pass blacked
 * out whole frames (school bands) whenever nothing crossed its luminance
 * threshold; the glow look is carried by additive materials + emissive
 * surfaces instead. These passes are luminance-independent, so they can never
 * poison a frame:
 *   · ChromaticAberration — tiny RGB split for a filmic edge
 *   · Noise (OVERLAY grain) — subtle texture that kills banding on flat skies
 *   · Vignette — darkens frame corners, keeps the eye on the story center
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.28} />
      <Vignette eskil={false} offset={0.28} darkness={0.5} />
    </EffectComposer>
  )
}
import { EffectComposer, Vignette } from "@react-three/postprocessing"

/**
 * Vignette ties the frame. Bloom was removed after it blacked out whole
 * frames (school bands) whenever nothing in the scene crossed its luminance
 * threshold — the glow look is carried by additive materials + emissive
 * surfaces instead, so no post-processing step can ever poison a frame.
 */
export function PostFX() {
 return (
  <EffectComposer multisampling={0}>
   <Vignette eskil={false} offset={0.28} darkness={0.42} />
  </EffectComposer>
 )
}

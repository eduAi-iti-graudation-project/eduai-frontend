import { useFrame } from "@react-three/fiber"
import type { ClipBank } from "./characters/Humanoid"

/**
 * Scroll-scrubbed animation hook: sets a paused action's pose time directly
 * from a 0..1 progress value every frame (before the shared mixer update).
 * The pose therefore tracks the scroll exactly — forward and backward.
 *
 * The progress getter must read the shared scroll timeline so camera,
 * character position and pose stay on one clock.
 */
export function useScrubbedAnimation(bank: ClipBank, clipName: string, getProgress: () => number) {
  useFrame(() => {
    bank.scrub(clipName, getProgress())
  })
}
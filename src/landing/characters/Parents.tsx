import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { landingConfig } from "../config"
import { localProgress, scrollState } from "../progress"
import { parentClips } from "../models"
import { useClipBank, useRiggedCharacter } from "./Humanoid"

function Parent({ url, position, rotationY }: { url: string; position: [number, number, number]; rotationY: number }) {
  const { scene, animations, rootRef, mixerRef } = useRiggedCharacter(url)
  const clips = useMemo(() => parentClips(animations), [animations])
  const bank = useClipBank(mixerRef, clips)
  const clapping = useRef(false)

  useEffect(() => {
    bank.fadeIn("idle", 0)
  }, [bank])

  useFrame(() => {
    // the guardians only belong to the celebration — they step away before
    // the pricing cards take the stage
    const p9 = localProgress(scrollState.value, 9)
    if (rootRef.current) rootRef.current.visible = p9 < 0.08
    // clap only in the finale (s8) — the sole appearance of the guardians
    const shouldClap = localProgress(scrollState.value, 8) > 0.45
    if (shouldClap && !clapping.current) {
      clapping.current = true
      bank.fadeIn("clap", 0.45)
    } else if (!shouldClap && clapping.current) {
      clapping.current = false
      bank.fadeIn("idle", 0.45)
    }
  })

  return (
    <group ref={rootRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={scene} />
    </group>
  )
}

/** Both guardians: appear only in the finale sky, clapping the celebration. */
export function Parents() {
  return (
    <>
      <Parent url={landingConfig.modelParentA} position={[-2.2, 0, 1.7]} rotationY={Math.PI - 0.45} />
      <Parent url={landingConfig.modelParentB} position={[2.2, 0, 1.7]} rotationY={Math.PI + 0.45} />
    </>
  )
}

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { BACKGROUNDS, bandAt, ENV_BY_BAND, ENV_Y } from "./scenes"
import { scrollState } from "./progress"
import { SkyPocket } from "./world/SkyPocket"
import { SchoolGatePocket } from "./world/SchoolGatePocket"
import { PortalPocket } from "./world/PortalPocket"
import { TunnelPocket } from "./world/TunnelPocket"
import { ClassroomPocket } from "./world/ClassroomPocket"
import { TestPaper } from "./world/TestPaper"
import { Confetti } from "./effects/Confetti"
import { Parents } from "./characters/Parents"
import { Robot } from "./characters/Robot"

/**
 * Owns the pocket worlds + the scene look. Every frame: exactly one pocket
 * group is visible (the rest hidden — hidden groups skip rendering), the
 * background color and fog are set per scene. Swaps are masked by the DOM
 * WarpFlash, so they read as dream dissolves, not pops.
 */
export function SceneManager() {
 const { scene } = useThree()
 const sceneRef = useRef(scene)
 const skyARef = useRef<THREE.Group>(null)
 const gateRef = useRef<THREE.Group>(null)
 const portalRef = useRef<THREE.Group>(null)
 const tunnelRef = useRef<THREE.Group>(null)
 const schoolRef = useRef<THREE.Group>(null)
 const skyBRef = useRef<THREE.Group>(null)

 useEffect(() => {
  sceneRef.current.background = new THREE.Color(BACKGROUNDS[0].color)
  sceneRef.current.fog = new THREE.Fog(BACKGROUNDS[0].color, BACKGROUNDS[0].fogNear, BACKGROUNDS[0].fogFar)
 }, [])

 useFrame(() => {
  const global = scrollState.value
  const env = ENV_BY_BAND[bandAt(global)]

  if (skyARef.current) skyARef.current.visible = env === "skyA"
  if (gateRef.current) gateRef.current.visible = env === "gate"
  if (portalRef.current) portalRef.current.visible = env === "portal"
  if (tunnelRef.current) tunnelRef.current.visible = env === "tunnel"
  if (schoolRef.current) schoolRef.current.visible = env === "school"
  if (skyBRef.current) skyBRef.current.visible = env === "skyB"

  const bg = BACKGROUNDS[bandAt(global)]
  const background = sceneRef.current.background as THREE.Color | null
  if (background) background.set(bg.color)
  const fog = sceneRef.current.fog as THREE.Fog | null
  if (fog) {
   fog.color.set(bg.color)
   fog.near = bg.fogNear
   fog.far = bg.fogFar
  }
 })

 return (
  <>
   <group ref={skyARef} position={[0, ENV_Y.skyA, 0]}>
    <SkyPocket />
   </group>
   <group ref={gateRef} position={[0, ENV_Y.gate, 0]}>
    <SchoolGatePocket />
   </group>
   <group ref={portalRef} position={[0, ENV_Y.portal, 0]}>
    <PortalPocket />
   </group>
   <group ref={tunnelRef} position={[0, ENV_Y.tunnel, 0]}>
    <TunnelPocket />
   </group>
   <group ref={schoolRef} position={[0, ENV_Y.school, 0]}>
    <ClassroomPocket />
    <Robot />
   </group>
   <group ref={skyBRef} position={[0, ENV_Y.skyB, 0]}>
    <SkyPocket />
    <Parents />
    <Confetti />
   </group>
   {/* Floating test paper — at root so it can show in both the school scenes and the celebration */}
   <TestPaper />
  </>
 )
}

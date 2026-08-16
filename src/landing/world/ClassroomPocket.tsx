import { useEffect, useRef } from "react"
import * as THREE from "three"

function Desk() {
 return (
  <group>
   <mesh position={[0, 0.62, 0]}>
    <boxGeometry args={[1.2, 0.08, 0.7]} />
    <meshStandardMaterial color="#b98a5f" />
   </mesh>
   {[
    [-0.45, -0.45],
    [0.45, -0.45],
    [-0.45, 0.45],
    [0.45, 0.45],
   ].map(([x, z], i) => (
    <mesh key={i} position={[x, 0.3, z]}>
     <cylinderGeometry args={[0.035, 0.035, 0.6, 6]} />
     <meshStandardMaterial color="#7c5a3a" />
    </mesh>
   ))}
  </group>
 )
}

function Board() {
 return (
  <group position={[0, 0, -0.06]}>
   <mesh>
    <boxGeometry args={[6, 2.6, 0.12]} />
    <meshStandardMaterial color="#eef0f6" />
   </mesh>
   <mesh position={[0, 0, 0.08]}>
    <planeGeometry args={[5.5, 2.1]} />
    <meshStandardMaterial color="#22704f" />
   </mesh>
   {[
    [-1.8, 0.4],
    [-0.5, 0.2],
    [0.9, 0.5],
   ].map(([x, y], i) => (
    <mesh key={i} position={[x, y, 0.1]}>
     <planeGeometry args={[1.5 + (i % 2) * 0.5, 0.035]} />
     <meshStandardMaterial color="#f5f2e0" />
    </mesh>
   ))}
  </group>
 )
}

/**
 * The school pocket — a complete classroom, static. The student falls into it
 * (scene 5) and stays for the tests (6) and the robot talk (7).
 */
export function ClassroomPocket() {
 const wallColor = "#eef0f7"
 const floorColor = "#c9b48f"
 const roomRef = useRef<THREE.Group>(null)

 // Lighting-independent look: unlit standard materials render pure black when
 // scene lighting glitches, so every room surface gets a soft self-glow.
 useEffect(() => {
  const g = roomRef.current
  if (!g) return
  g.traverse((o) => {
   const mesh = o as THREE.Mesh
   if (!mesh.isMesh) return
   const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
   for (const m of materials) {
    const mat = m as THREE.MeshStandardMaterial
    if (!mat.emissive || mat.emissive.getHex() !== 0) continue
    mat.emissive.copy(mat.color).multiplyScalar(0.55)
    mat.emissiveIntensity = 0.6
   }
  })
 }, [])

 return (
  <group ref={roomRef}>
   {/* floor */}
   <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
    <planeGeometry args={[16, 12]} />
    <meshStandardMaterial color={floorColor} />
   </mesh>

   {/* left wall + door */}
   <group position={[-4.5, 2.2, 0]}>
    <mesh>
     <boxGeometry args={[0.2, 4.4, 12]} />
     <meshStandardMaterial color={wallColor} />
    </mesh>
    <mesh position={[0.12, 1.45, 0]}>
     <boxGeometry args={[0.16, 2.9, 1.5]} />
     <meshStandardMaterial color="#8a6a4a" />
    </mesh>
   </group>

   {/* right wall + windows */}
   <group position={[4.5, 2.2, 0]}>
    <mesh>
     <boxGeometry args={[0.2, 4.4, 12]} />
     <meshStandardMaterial color={wallColor} />
    </mesh>
    {[1.8, -1.8].map((z) => (
     <group key={z} position={[-0.12, 2.3, z]}>
      <mesh>
       <boxGeometry args={[0.16, 1.5, 2]} />
       <meshStandardMaterial color="#bfe3ff" emissive="#9fc8ec" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
       <boxGeometry args={[0.06, 1.5, 0.09]} />
       <meshStandardMaterial color="#5b6b85" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
       <boxGeometry args={[0.06, 0.09, 2]} />
       <meshStandardMaterial color="#5b6b85" />
      </mesh>
     </group>
    ))}
   </group>

   {/* back wall */}
   <mesh position={[0, 2.2, -5.5]}>
    <boxGeometry args={[16, 4.4, 0.2]} />
    <meshStandardMaterial color={wallColor} />
   </mesh>

   {/* board */}
   <group position={[0, 1.9, -5.06]}>
    <Board />
   </group>

   {/* desk row */}
   <group position={[-1.6, 0, -1.7]}>
    <Desk />
   </group>
   <group position={[1.6, 0, -1.7]}>
    <Desk />
   </group>
   <group position={[0, 0, -2.3]}>
    <Desk />
   </group>
  </group>
 )
}

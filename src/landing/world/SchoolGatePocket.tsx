function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 2.2, 6]} />
        <meshStandardMaterial color="#a0684a" />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial color="#5f9e6b" flatShading />
      </mesh>
      <mesh position={[0.8, 2.6, 0.3]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#71ad77" flatShading />
      </mesh>
    </group>
  )
}

function Fence({ side }: { side: 1 | -1 }) {
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => {
        const z = 2 + i * 1.05
        return (
          <mesh key={i} position={[side * 2.5, 0.55, z]}>
            <boxGeometry args={[0.09, 1.1, 0.09]} />
            <meshStandardMaterial color="#f3ead8" />
          </mesh>
        )
      })}
      <mesh position={[side * 2.5, 1.02, 5.6]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.09, 7.5, 0.07]} />
        <meshStandardMaterial color="#f3ead8" />
      </mesh>
      <mesh position={[side * 2.5, 0.42, 5.6]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.09, 7.5, 0.07]} />
        <meshStandardMaterial color="#efe2c9" />
      </mesh>
    </group>
  )
}

/**
 * The school gate pocket — the fall lands here (scene 2). The student walks
 * from the pocket origin toward the gate arch at z ≈ 5 while the camera
 * follows from behind. Fences + trees flank the path on both sides.
 */
export function SchoolGatePocket() {
  return (
    <group>
      {/* ground / schoolyard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -2]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#cfe3cd" />
      </mesh>
      {/* path to the gate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.2]}>
        <planeGeometry args={[2.6, 9]} />
        <meshStandardMaterial color="#e4dcc9" />
      </mesh>

      {/* gate arch */}
      <mesh position={[-2.1, 1.7, 5]}>
        <boxGeometry args={[0.55, 3.4, 0.55]} />
        <meshStandardMaterial color="#e8e0cf" flatShading />
      </mesh>
      <mesh position={[2.1, 1.7, 5]}>
        <boxGeometry args={[0.55, 3.4, 0.55]} />
        <meshStandardMaterial color="#e8e0cf" flatShading />
      </mesh>
      <mesh position={[0, 3.7, 5]}>
        <boxGeometry args={[4.75, 0.55, 0.75]} />
        <meshStandardMaterial color="#e8e0cf" flatShading />
      </mesh>
      {/* violet cap on the arch — dream tie-in */}
      <mesh position={[0, 4, 5]}>
        <boxGeometry args={[4.4, 0.22, 0.5]} />
        <meshStandardMaterial color="#a78bfa" flatShading />
      </mesh>

      <Fence side={1} />
      <Fence side={-1} />

      <Tree position={[-5, 0, 0.5]} scale={1.15} />
      <Tree position={[-4.4, 0, 7]} scale={0.9} />
      <Tree position={[5.4, 0, 1]} scale={1.2} />
      <Tree position={[5, 0, 7.5]} scale={0.95} />
    </group>
  )
}

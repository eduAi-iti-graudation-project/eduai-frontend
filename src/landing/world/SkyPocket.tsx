function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]} scale={[1.6, 0.4, 0.9]}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#ffffff" flatShading transparent opacity={0.92} />
      </mesh>
      <mesh position={[1.15, 0.18, 0.2]} scale={[1.2, 0.38, 0.8]}>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial color="#f4f8ff" flatShading transparent opacity={0.9} />
      </mesh>
      <mesh position={[-1.1, 0.12, -0.15]} scale={[1, 0.35, 0.7]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#f0f5ff" flatShading transparent opacity={0.88} />
      </mesh>
    </group>
  )
}

/** Dream sky pocket — soft clouds + a warm sun. Used by the hello + finale. */
export function SkyPocket() {
  return (
    <group>
      <mesh position={[6.5, 5.4, -12]}>
        <circleGeometry args={[3.6, 48]} />
        <meshBasicMaterial color="#fff3d0" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh position={[6.5, 5.4, -12]}>
        <circleGeometry args={[1.7, 48]} />
        <meshBasicMaterial color="#fff7e0" transparent opacity={0.8} toneMapped={false} />
      </mesh>

      <Cloud position={[-7.5, 3.2, -6]} scale={1.15} />
      <Cloud position={[5.5, 2.5, -3]} scale={0.9} />
      <Cloud position={[-3, 4.7, -9]} scale={1.3} />
      <Cloud position={[8.5, 4.1, -11]} scale={1.05} />
      <Cloud position={[0.5, 2.1, -4.5]} scale={0.8} />
      <Cloud position={[-6.5, 5.5, -12]} scale={1.4} />
      <Cloud position={[3.2, 3.7, -8]} scale={1.1} />
      <Cloud position={[-2, 2.8, -2]} scale={0.7} />
    </group>
  )
}

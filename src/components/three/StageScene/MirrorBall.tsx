import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function MirrorBall({ position }: { position: [number, number, number] }) {
  const ball = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (ball.current) ball.current.rotation.y += delta * 0.25
  })

  return (
    <group position={position}>
      {/* hanging wire */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.6, 6]} />
        <meshBasicMaterial color="#4a3a2a" />
      </mesh>
      <mesh ref={ball}>
        <icosahedronGeometry args={[0.5, 3]} />
        <meshStandardMaterial
          color="#f0e6d8"
          metalness={0.85}
          roughness={0.18}
          flatShading
          envMapIntensity={3.5}
          emissive="#3a2a12"
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight color="#e8c97a" intensity={6} distance={6} position={[1.2, -0.4, 1]} />
      <pointLight color="#e2bd6d" intensity={3} distance={5} position={[-1.2, 0.3, 1]} />
    </group>
  )
}
